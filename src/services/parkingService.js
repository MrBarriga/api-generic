await parking.update(updateData, { transaction });

// Atualizar ou criar endereço do estacionamento, se fornecido
if (address) {
    const existingAddress = await Address.findOne({
        where: { parking_id: id }
    });

    if (existingAddress) {
        await existingAddress.update({
            ...address,
            latitude: coordinates?.latitude || existingAddress.latitude,
            longitude: coordinates?.longitude || existingAddress.longitude
        }, { transaction });
    } else {
        await Address.create({
            ...address,
            parking_id: id,
            latitude: coordinates?.latitude,
            longitude: coordinates?.longitude
        }, { transaction });
    }
}

await transaction.commit();
return await Parking.findByPk(id);
try {
    await transaction.commit();
    return await Parking.findByPk(id);
} catch (error) {
    await transaction.rollback();
    throw error;
}

/**
 * Criar uma nova vaga no estacionamento
 */
async function createParkingSpot(parkingId, spotData) {
    // Verificar se o estacionamento existe
    const parking = await Parking.findByPk(parkingId);
    if (!parking) {
        throw new Error("Estacionamento não encontrado");
    }

    const {
        identifier, type, dimensions, price_minute,
        price_hour, price_day, price_month, availability
    } = spotData;

    // Criar a vaga
    const spot = await ParkingSpot.create({
        parking_id: parkingId,
        identifier,
        type: type || 'STANDARD',
        dimensions,
        price_minute,
        price_hour,
        price_day,
        price_month,
        availability,
        status: 'AVAILABLE',
        created_at: new Date()
    });

    return spot;
}

/**
 * Buscar estacionamentos próximos
 */
async function findNearbyParkings(locationData) {
    const { latitude, longitude, radius, type } = locationData;

    if (!latitude || !longitude) {
        throw new Error("Latitude e longitude são obrigatórios");
    }

    // Converter raio para metros (valor padrão: 1000 metros)
    const searchRadius = radius ? parseFloat(radius) : 1000;

    // Consulta utilizando funções espaciais do PostGIS (se estiver usando PostgreSQL)
    const parkings = await Parking.findAll({
        where: {
            status: 'ACTIVE',
            ...(type && { type }),
            // Usar função ST_DWithin para buscar pontos dentro de um raio (PostgreSQL com PostGIS)
            coordinates: sequelize.literal(`ST_DWithin(coordinates, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326), ${searchRadius})`)
        },
        include: [
            {
                model: Address,
                required: false
            }
        ],
        // Ordenar por distância
        order: sequelize.literal(`ST_Distance(coordinates, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326))`)
    });

    return parkings;
}

/**
 * Criar uma reserva de vaga
 */
async function createReservation(reservationData) {
    const transaction = await sequelize.transaction();

    try {
        const {
            spot_id, parking_id, user_id, start_time,
            end_time, payment_method, notes
        } = reservationData;

        // Verificar se a vaga existe e está disponível
        const spot = await ParkingSpot.findOne({
            where: {
                id: spot_id,
                parking_id,
                status: 'AVAILABLE'
            }
        });

        if (!spot) {
            await transaction.rollback();
            throw new Error("Vaga não encontrada ou não disponível");
        }

        // Verificar se já existe outra reserva para esta vaga no mesmo período
        const conflictingReservation = await ParkingReservation.findOne({
            where: {
                spot_id,
                status: {
                    [Op.in]: ['SCHEDULED', 'ACTIVE']
                },
                [Op.or]: [
                    {
                        start_time: {
                            [Op.between]: [new Date(start_time), new Date(end_time)]
                        }
                    },
                    {
                        end_time: {
                            [Op.between]: [new Date(start_time), new Date(end_time)]
                        }
                    },
                    {
                        [Op.and]: [
                            {
                                start_time: {
                                    [Op.lte]: new Date(start_time)
                                }
                            },
                            {
                                end_time: {
                                    [Op.gte]: new Date(end_time)
                                }
                            }
                        ]
                    }
                ]
            }
        });

        if (conflictingReservation) {
            await transaction.rollback();
            throw new Error("Já existe uma reserva para esta vaga no período solicitado");
        }

        // Calcular preço estimado
        const startDateTime = new Date(start_time);
        const endDateTime = new Date(end_time);
        const durationHours = (endDateTime - startDateTime) / (1000 * 60 * 60);

        // Preço por hora como fallback
        let estimatedPrice = spot.price_hour * durationHours;

        // Se a duração for maior que 24 horas e tiver preço diário, usar preço diário
        if (durationHours >= 24 && spot.price_day) {
            const days = Math.ceil(durationHours / 24);
            estimatedPrice = spot.price_day * days;
        }

        // Se a duração for maior que 30 dias e tiver preço mensal, usar preço mensal
        if (durationHours >= 720 && spot.price_month) { // 720 horas = 30 dias
            const months = Math.ceil(durationHours / 720);
            estimatedPrice = spot.price_month * months;
        }

        // Criar a reserva
        const reservation = await ParkingReservation.create({
            spot_id,
            parking_id,
            user_id,
            start_time: startDateTime,
            end_time: endDateTime,
            status: 'SCHEDULED',
            estimated_price: estimatedPrice,
            payment_method,
            notes,
            created_at: new Date()
        }, { transaction });

        // Atualizar o status da vaga para RESERVED
        await spot.update({ status: 'RESERVED' }, { transaction });

        await transaction.commit();
        return reservation;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

/**
 * Confirmar entrada no estacionamento
 */
async function checkIn(reservationId) {
    const transaction = await sequelize.transaction();

    try {
        // Verificar se a reserva existe e está no status correto
        const reservation = await ParkingReservation.findOne({
            where: {
                id: reservationId,
                status: 'SCHEDULED'
            },
            include: [
                {
                    model: ParkingSpot
                }
            ]
        });

        if (!reservation) {
            await transaction.rollback();
            throw new Error("Reserva não encontrada ou não está agendada");
        }

        // Atualizar o status da reserva
        await reservation.update({
            status: 'ACTIVE',
            entry_time: new Date()
        }, { transaction });

        await transaction.commit();
        return await ParkingReservation.findByPk(reservationId);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

/**
 * Confirmar saída do estacionamento e finalizar reserva
 */
async function checkOut(reservationId, paymentInfo = {}) {
    const transaction = await sequelize.transaction();

    try {
        // Verificar se a reserva existe e está no status correto
        const reservation = await ParkingReservation.findOne({
            where: {
                id: reservationId,
                status: 'ACTIVE'
            },
            include: [
                {
                    model: ParkingSpot
                }
            ]
        });

        if (!reservation) {
            await transaction.rollback();
            throw new Error("Reserva não encontrada ou não está ativa");
        }

        const exitTime = new Date();

        // Calcular preço final com base no tempo real de uso
        const entryTime = reservation.entry_time;
        const durationHours = (exitTime - entryTime) / (1000 * 60 * 60);

        // Usar lógica similar ao cálculo do preço estimado
        let finalPrice = reservation.ParkingSpot.price_hour * durationHours;

        if (durationHours >= 24 && reservation.ParkingSpot.price_day) {
            const days = Math.ceil(durationHours / 24);
            finalPrice = reservation.ParkingSpot.price_day * days;
        }

        if (durationHours >= 720 && reservation.ParkingSpot.price_month) {
            const months = Math.ceil(durationHours / 720);
            finalPrice = reservation.ParkingSpot.price_month * months;
        }

        // Atualizar o status da reserva
        await reservation.update({
            status: 'COMPLETED',
            exit_time: exitTime,
            final_price: finalPrice,
            transaction_id: paymentInfo?.transaction_id || null
        }, { transaction });

        // Atualizar o status da vaga para AVAILABLE
        await reservation.ParkingSpot.update({ status: 'AVAILABLE' }, { transaction });

        await transaction.commit();
        return await ParkingReservation.findByPk(reservationId);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

/**
 * Cancelar uma reserva
 */
async function cancelReservation(reservationId, reason = '') {
    const transaction = await sequelize.transaction();

    try {
        // Verificar se a reserva existe e está em um status cancelável
        const reservation = await ParkingReservation.findOne({
            where: {
                id: reservationId,
                status: {
                    [Op.in]: ['SCHEDULED', 'ACTIVE']
                }
            },
            include: [
                {
                    model: ParkingSpot
                }
            ]
        });

        if (!reservation) {
            await transaction.rollback();
            throw new Error("Reserva não encontrada ou não pode ser cancelada");
        }

        // Atualizar o status da reserva
        await reservation.update({
            status: 'CANCELLED',
            notes: reason ? (reservation.notes ? reservation.notes + "\nCancelamento: " + reason : "Cancelamento: " + reason) : reservation.notes
        }, { transaction });

        // Atualizar o status da vaga para AVAILABLE
        await reservation.ParkingSpot.update({ status: 'AVAILABLE' }, { transaction });

        await transaction.commit();
        return await ParkingReservation.findByPk(reservationId);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

/**
 * Listar reservas de um usuário
 */
async function getUserReservations(userId, statusFilter = null) {
    let whereCondition = { user_id: userId };
    if (statusFilter) {
        whereCondition.status = statusFilter;
    }

    const reservations = await ParkingReservation.findAll({
        where: whereCondition,
        include: [
            {
                model: ParkingSpot,
                attributes: ['id', 'identifier', 'type']
            },
            {
                model: Parking,
                attributes: ['id', 'name', 'type'],
                include: [
                    {
                        model: Address,
                        required: false
                    }
                ]
            }
        ],
        order: [['start_time', 'DESC']]
    });

    return reservations;
}

/**
 * Listar vagas disponíveis em um estacionamento
 */
async function getAvailableSpots(parkingId, timeRange = null) {
    let whereCondition = {
        parking_id: parkingId,
        status: 'AVAILABLE'
    };

    const spots = await ParkingSpot.findAll({
        where: whereCondition
    });

    // Se um intervalo de tempo for fornecido, verificar também reservas futuras
    if (timeRange && timeRange.start_time && timeRange.end_time) {
        const startTime = new Date(timeRange.start_time);
        const endTime = new Date(timeRange.end_time);

        // Filtrar spots que não têm reservas conflitantes
        const availableSpots = [];

        for (const spot of spots) {
            const conflictingReservations = await ParkingReservation.count({
                where: {
                    spot_id: spot.id,
                    status: {
                        [Op.in]: ['SCHEDULED', 'ACTIVE']
                    },
                    [Op.or]: [
                        {
                            start_time: {
                                [Op.between]: [startTime, endTime]
                            }
                        },
                        {
                            end_time: {
                                [Op.between]: [startTime, endTime]
                            }
                        },
                        {
                            [Op.and]: [
                                {
                                    start_time: {
                                        [Op.lte]: startTime
                                    }
                                },
                                {
                                    end_time: {
                                        [Op.gte]: endTime
                                    }
                                }
                            ]
                        }
                    ]
                }
            });

            if (conflictingReservations === 0) {
                availableSpots.push(spot);
            }
        }

        return availableSpots;
    }

    return spots;
}

module.exports = {
    createParking,
    getParkingById,
    updateParking,
    createParkingSpot,
    findNearbyParkings,
    createReservation,
    checkIn,
    checkOut,
    cancelReservation,
    getUserReservations,
    getAvailableSpots
};