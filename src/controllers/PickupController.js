const StudentPickup = require("../models/StudentPickup");
const Student = require("../models/Student");
const StudentGuardian = require("../models/StudentGuardian");
const User = require("../models/User");
const School = require("../models/School");
const sequelize = require("../config/database");
const { Op } = require("sequelize");

// Solicitar retirada de aluno
exports.requestPickup = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { student_id, guardian_id, location, notes } = req.body;

        // Verificar se o aluno existe
        const student = await Student.findByPk(student_id);
        if (!student) {
            await transaction.rollback();
            return res.status(404).json({ error: "Aluno não encontrado" });
        }

        // Verificar se o responsável está autorizado para este aluno
        const guardianAuth = await StudentGuardian.findOne({
            where: {
                student_id,
                user_id: guardian_id,
                can_pickup: true
            }
        });

        if (!guardianAuth) {
            await transaction.rollback();
            return res.status(403).json({ error: "Responsável não autorizado para retirar este aluno" });
        }

        // Verificar se já existe uma solicitação ativa
        const activeRequest = await StudentPickup.findOne({
            where: {
                student_id,
                status: {
                    [Op.in]: ['REQUESTED', 'RELEASED']
                }
            }
        });

        if (activeRequest) {
            await transaction.rollback();
            return res.status(400).json({ error: "Já existe uma solicitação ativa para este aluno" });
        }

        // Criar ponto de localização se fornecido
        let guardianLocation = null;
        if (location && location.latitude && location.longitude) {
            guardianLocation = {
                type: 'Point',
                coordinates: [location.longitude, location.latitude]
            };
        }

        // Criar a solicitação de retirada
        const pickup = await StudentPickup.create({
            student_id,
            guardian_id,
            school_id: student.school_id,
            request_time: new Date(),
            status: 'REQUESTED',
            guardian_location: guardianLocation,
            notes,
            created_at: new Date()
        }, { transaction });

        // Atualizar o status do aluno
        await student.update({ exit_status: 'WAITING_EXIT' }, { transaction });

        await transaction.commit();

        res.status(201).json({
            message: "Solicitação de retirada criada com sucesso",
            pickup
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Erro ao solicitar retirada:", error);
        res.status(500).json({ error: "Falha ao solicitar retirada" });
    }
};

// Liberar aluno para saída (ação do funcionário da escola)
exports.releaseStudent = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { pickup_id } = req.params;
        const { staff_id, notes } = req.body;

        // Verificar se a solicitação existe e está no status correto
        const pickup = await StudentPickup.findOne({
            where: {
                id: pickup_id,
                status: 'REQUESTED'
            },
            include: [
                {
                    model: Student
                }
            ]
        });

        if (!pickup) {
            await transaction.rollback();
            return res.status(404).json({ error: "Solicitação de retirada não encontrada ou já processada" });
        }

        // Verificar se o funcionário existe e pertence à escola
        const staff = await User.findOne({
            where: {
                id: staff_id,
                user_type: {
                    [Op.in]: ['ADMIN', 'SCHOOL']
                }
            }
        });

        if (!staff) {
            await transaction.rollback();
            return res.status(403).json({ error: "Funcionário não autorizado" });
        }

        // Atualizar o status da solicitação
        await pickup.update({
            status: 'RELEASED',
            staff_id,
            release_time: new Date(),
            notes: notes ? pickup.notes + "\n" + notes : pickup.notes
        }, { transaction });

        // Atualizar o status do aluno
        await pickup.Student.update({ exit_status: 'RELEASED' }, { transaction });

        await transaction.commit();

        res.status(200).json({
            message: "Aluno liberado para saída com sucesso",
            pickup: await StudentPickup.findByPk(pickup_id)
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Erro ao liberar aluno:", error);
        res.status(500).json({ error: "Falha ao liberar aluno" });
    }
};

// Confirmar retirada do aluno (ação do responsável)
exports.confirmPickup = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { pickup_id } = req.params;
        const { confirmation_photo, location } = req.body;

        // Verificar se a solicitação existe e está no status correto
        const pickup = await StudentPickup.findOne({
            where: {
                id: pickup_id,
                status: 'RELEASED'
            },
            include: [
                {
                    model: Student
                }
            ]
        });

        if (!pickup) {
            await transaction.rollback();
            return res.status(404).json({ error: "Solicitação de retirada não encontrada ou não liberada" });
        }

        // Atualizar localização se fornecida
        let guardianLocation = pickup.guardian_location;
        if (location && location.latitude && location.longitude) {
            guardianLocation = {
                type: 'Point',
                coordinates: [location.longitude, location.latitude]
            };
        }

        // Calcular tempo de espera
        const pickup_time = new Date();
        const wait_time = Math.round((pickup_time - pickup.request_time) / (1000 * 60)); // em minutos

        // Atualizar confirmação de fotos
        let photos = pickup.confirmation_photos || [];
        if (confirmation_photo) {
            photos = [...photos, confirmation_photo];
        }

        // Atualizar o status da solicitação
        await pickup.update({
            status: 'COMPLETED',
            pickup_time,
            wait_time,
            guardian_location: guardianLocation,
            confirmation_photos: photos
        }, { transaction });

        // Atualizar o status do aluno
        await pickup.Student.update({ exit_status: 'PICKED_UP' }, { transaction });

        await transaction.commit();

        res.status(200).json({
            message: "Retirada confirmada com sucesso",
            pickup: await StudentPickup.findByPk(pickup_id)
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Erro ao confirmar retirada:", error);
        res.status(500).json({ error: "Falha ao confirmar retirada" });
    }
};

// Cancelar solicitação de retirada
exports.cancelPickup = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { pickup_id } = req.params;
        const { reason } = req.body;

        // Verificar se a solicitação existe e está em um status cancelável
        const pickup = await StudentPickup.findOne({
            where: {
                id: pickup_id,
                status: {
                    [Op.in]: ['REQUESTED', 'RELEASED']
                }
            },
            include: [
                {
                    model: Student
                }
            ]
        });

        if (!pickup) {
            await transaction.rollback();
            return res.status(404).json({ error: "Solicitação de retirada não encontrada ou não pode ser cancelada" });
        }

        // Atualizar o status da solicitação
        await pickup.update({
            status: 'CANCELLED',
            notes: reason ? (pickup.notes ? pickup.notes + "\nCancelamento: " + reason : "Cancelamento: " + reason) : pickup.notes
        }, { transaction });

        // Atualizar o status do aluno de volta para 'AT_SCHOOL'
        await pickup.Student.update({ exit_status: 'AT_SCHOOL' }, { transaction });

        await transaction.commit();

        res.status(200).json({
            message: "Solicitação de retirada cancelada com sucesso",
            pickup: await StudentPickup.findByPk(pickup_id)
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Erro ao cancelar retirada:", error);
        res.status(500).json({ error: "Falha ao cancelar retirada" });
    }
};

// Listar solicitações de retirada por escola (para funcionários da escola)
exports.getPickupsBySchool = async (req, res) => {
    try {
        const { school_id } = req.params;
        const { status, date } = req.query;

        let whereCondition = { school_id };

        if (status) {
            whereCondition.status = status;
        }

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);

            whereCondition.request_time = {
                [Op.between]: [startDate, endDate]
            };
        }

        const pickups = await StudentPickup.findAll({
            where: whereCondition,
            include: [
                {
                    model: Student,
                    attributes: ['id', 'name', 'photo', 'exit_status']
                },
                {
                    model: User,
                    as: 'guardian',
                    attributes: ['id', 'name', 'phone_number', 'profile_photo']
                },
                {
                    model: User,
                    as: 'staff',
                    attributes: ['id', 'name'],
                    required: false
                }
            ],
            order: [['request_time', 'DESC']]
        });

        res.status(200).json(pickups);
    } catch (error) {
        console.error("Erro ao listar solicitações de retirada:", error);
        res.status(500).json({ error: "Falha ao listar solicitações" });
    }
};

// Obter histórico de retiradas de um aluno
exports.getStudentPickupHistory = async (req, res) => {
    try {
        const { student_id } = req.params;
        const { startDate, endDate } = req.query;

        let whereCondition = { student_id };

        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            whereCondition.request_time = {
                [Op.between]: [start, end]
            };
        }

        const pickups = await StudentPickup.findAll({
            where: whereCondition,
            include: [
                {
                    model: User,
                    as: 'guardian',
                    attributes: ['id', 'name', 'phone_number']
                }
            ],
            order: [['request_time', 'DESC']]
        });

        res.status(200).json(pickups);
    } catch (error) {
        console.error("Erro ao obter histórico de retiradas:", error);
        res.status(500).json({ error: "Falha ao obter histórico" });
    }
};