const Parking = require("../models/Parking");
const ParkingSpot = require("../models/ParkingSpot");
const ParkingReservation = require("../models/ParkingReservation");
const User = require("../models/User");
const Address = require("../models/Address");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

// Criar um novo estacionamento
exports.createParking = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const {
            name, type, owner_id, description, rules,
            operation_hours, photos, address, coordinates
        } = req.body;

        // Verificar se o proprietário existe e é do tipo provedor de estacionamento
        const owner = await User.findOne({
            where: {
                id: owner_id,
                user_type: 'PARKING_PROVIDER'
            }
        });

        if (!owner) {
            await transaction.rollback();
            return res.status(404).json({
                error: "Proprietário não encontrado ou não é um provedor de estacionamento"
            });
        }

        // Criar coordenadas de ponto geográfico
        let locationPoint = null;
        if (coordinates && coordinates.latitude && coordinates.longitude) {
            locationPoint = {
                type: 'Point',
                coordinates: [coordinates.longitude, coordinates.latitude]
            };
        }

        // Criar o estacionamento
        const parking = await Parking.create({
            name,
            type,
            owner_id,
            description,
            rules,
            operation_hours,
            photos,
            coordinates: locationPoint,
            status: 'PENDING_APPROVAL',
            created_at: new Date()
        }, { transaction });

        // Criar endereço do estacionamento, se fornecido
        if (address) {
            await Address.create({
                ...address,
                parking_id: parking.id,
                latitude: coordinates?.latitude,
                longitude: coordinates?.longitude
            }, { transaction });
        }

        await transaction.commit();

        res.status(201).json({
            message: "Estacionamento criado com sucesso",
            parking
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Erro ao criar estacionamento:", error);
        res.status(500).json({ error: "Falha ao criar estacionamento" });
    }
};

// Obter detalhes de um estacionamento específico
exports.getParking = async (req, res) => {
    try {
        const { id } = req.params;

        const parking = await Parking.findByPk(id, {
            include: [
                {
                    model: Address,
                    required: false
                },
                {
                    model: User,
                    as: 'owner',
                    attributes: ['id', 'name', 'email', 'phone_number']
                },
                {
                    model: ParkingSpot,
                    required: false
                }
            ]
        });

        if (!parking) {
            return res.status(404).json({ error: "Estacionamento não encontrado" });
        }

        res.status(200).json(parking);
    } catch (error) {
        console.error("Erro ao buscar estacionamento:", error);
        res.status(500).json({ error: "Falha ao buscar estacionamento" });
    }
};

// Atualizar dados do estacionamento
exports.updateParking = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { id } = req.params;
        const {
            name, description, rules, operation_hours,
            photos, status, address, coordinates
        } = req.body;

        // Verificar se o estacionamento existe
        const parking = await Parking.findByPk(id);
        if (!parking) {
            await transaction.rollback();
            return res.status(404).json({ error: "Estacionamento não encontrado" });
        }

        // Atualizar coordenadas se fornecidas
        let locationPoint = parking.coordinates;
        if (coordinates && coordinates.latitude && coordinates.longitude) {
            locationPoint = {
                type: 'Point',
                coordinates: [coordinates.longitude, coordinates.latitude]
            };
        }

        // Atualizar dados do estacionamento
        const updateData = {};
        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (rules !== undefined) updateData.rules = rules;
        if (operation_hours) updateData.operation_hours = operation_hours;
        if (photos) updateData.photos = photos;
        if (status) updateData.status = status;
        if (locationPoint) updateData.coordinates = locationPoint;

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

        res.status(200).json({
            message: "Estacionamento atualizado com sucesso",
            parking: await Parking.findByPk(id)
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Erro ao atualizar estacionamento:", error);
        res.status(500).json({ error: "Falha ao atualizar estacionamento" });
    }
};

// Criar uma nova vaga no estacionamento
exports.createParkingSpot = async (req, res) => {
    try {
        const { parking_id } = req.params;
        const {
            identifier, type, dimensions, price_minute,
            price_hour, price_day, price_month, availability
        } = req.body;

        // Verificar se o estacionamento existe
        const parking = await Parking.findByPk(parking_id);
        if (!parking) {
            return res.status(404).json({ error: "Estacionamento não encontrado" });
        }

        // Criar a vaga
        const spot = await ParkingSpot.create({
            parking_id,
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

        res.status(201).json({
            message: "Vaga criada com sucesso",
            spot
        });
    } catch (error) {
        console.error("Erro ao criar vaga:", error);
        res.status(500).json({ error: "Falha ao criar vaga" });
    }
};

// Buscar estacionamentos próximos
exports.findNearbyParkings = async (req, res) => {
    try {
        const { latitude, longitude, radius, type } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({ error: "Latitude e longitude são obrigatórios" });
        }

        // Converter raio para metros (valor padrão: 1000 metros)
        const searchRadius = radius ? parseFloat(radius) : 1000;

        // Consulta utilizando funções espaciais do PostGIS (se estiver usando PostgreSQL)
        const parkings = await Parking.findAll({
            where: {
                status: 'ACTIVE',
                ...(type && { type }),
                // Usar função ST_DWithin para buscar pontos dentro de um raio (PostgreSQL com PostGIS)
                // Nota: Se não estiver usando PostgreSQL, você precisará implementar de outra forma
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

        res.status(200).json(parkings);
    } catch (error) {
        console.error("Erro ao buscar estacionamentos próximos:", error);
        res.status(500).json({ error: "Falha ao buscar estacionamentos" });
    }
};

// Criar uma reserva de vaga
exports.createReservation = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const {
            spot_id, parking_id, user_id, start_time,
            end_time, payment_method, notes
        } = req.body;

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
            return res.status(404).json({ error: "Vaga não encontrada ou não disponível" });
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
            return res.status(400).json({
                error: "Já existe uma reserva para esta vaga no período solicitado"
            });
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

        res.status(201).json({
            message: "Reserva criada com sucesso",
            reservation
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Erro ao criar reserva:", error);
        res.status(500).json({ error: "Falha ao criar reserva" });
    }
};

// Confirmar entrada no estacionamento
exports.checkIn = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { reservation_id } = req.params;

        // Verificar se a reserva existe e está no status correto
        const reservation = await ParkingReservation.findOne({
            where: {
                id: reservation_id,
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
            return res.status(404).json({ error: "Reserva não encontrada ou não está agendada" });
        }

        // Atualizar o status da reserva
        await reservation.update({
            status: 'ACTIVE',
            entry_time: new Date()
        }, { transaction });

        await transaction.commit();

        res.status(200).json({
            message: "Check-in realizado com sucesso",
            reservation: await ParkingReservation.findByPk(reservation_id)
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Erro ao realizar check-in:", error);
        res.status(500).json({ error: "Falha ao realizar check-in" });
    }
};

// Confirmar saída do estacionamento e finalizar reserva
exports.checkOut = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { reservation_id } = req.params;
        const { payment_info } = req.body;

        // Verificar se a reserva existe e está no status correto
        const reservation = await ParkingReservation.findOne({
            where: {
                id: reservation_id,
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
            return res.status(404).json({ error: "Reserva não encontrada ou não está ativa" });
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
            transaction_id: payment_info?.transaction_id || null
        }, { transaction });

        // Atualizar o status da vaga para AVAILABLE
        await reservation.ParkingSpot.update({ status: 'AVAILABLE' }, { transaction });

        await transaction.commit();

        res.status(200).json({
            message: "Check-out realizado com sucesso",
            reservation: await ParkingReservation.findByPk(reservation_id)
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Erro ao realizar check-out:", error);
        res.status(500).json({ error: "Falha ao realizar check-out" });
    }
};

// Cancelar uma reserva
exports.cancelReservation = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { reservation_id } = req.params;
        const { reason } = req.body;

        // Verificar se a reserva existe e está em um status cancelável
        const reservation = await ParkingReservation.findOne({
            where: {
                id: reservation_id,
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
            return res.status(404).json({ error: "Reserva não encontrada ou não pode ser cancelada" });
        }

        // Atualizar o status da reserva
        await reservation.update({
            status: 'CANCELLED',
            notes: reason ? (reservation.notes ? reservation.notes + "\nCancelamento: " + reason : "Cancelamento: " + reason) : reservation.notes
        }, { transaction });

        // Atualizar o status da vaga para AVAILABLE
        await reservation.ParkingSpot.update({ status: 'AVAILABLE' }, { transaction });

        await transaction.commit();

        res.status(200).json({
            message: "Reserva cancelada com sucesso",
            reservation: await ParkingReservation.findByPk(reservation_id)
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Erro ao cancelar reserva:", error);
        res.status(500).json({ error: "Falha ao cancelar reserva" });
    }
};

// Listar reservas de um usuário
exports.getUserReservations = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { status } = req.query;

        let whereCondition = { user_id };
        if (status) {
            whereCondition.status = status;
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

        res.status(200).json(reservations);
    } catch (error) {
        console.error("Erro ao listar reservas do usuário:", error);
        res.status(500).json({ error: "Falha ao listar reservas" });
    }
};