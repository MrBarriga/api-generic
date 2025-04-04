const School = require("../models/School");
const User = require("../models/User");
const Address = require("../models/Address");
const Class = require("../models/Class");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

// Criar uma nova escola
exports.createSchool = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const {
            name, cnpj, phone_number, email, website, logo,
            operation_hours, responsible_user_id, address, plan
        } = req.body;

        // Verificar se responsável existe e é do tipo SCHOOL
        const responsibleUser = await User.findOne({
            where: {
                id: responsible_user_id,
                user_type: 'SCHOOL'
            }
        });

        if (!responsibleUser) {
            await transaction.rollback();
            return res.status(404).json({
                error: "Responsável não encontrado ou não possui permissões de escola"
            });
        }

        // Criar a escola
        const school = await School.create({
            name,
            cnpj,
            phone_number,
            email,
            website,
            logo,
            operation_hours,
            responsible_user_id,
            plan: plan || 'BASIC',
            status: 'ACTIVE',
            created_at: new Date()
        }, { transaction });

        // Criar endereço da escola, se fornecido
        if (address) {
            await Address.create({
                ...address,
                school_id: school.id
            }, { transaction });
        }

        await transaction.commit();

        res.status(201).json({
            message: "Escola criada com sucesso",
            school
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Erro ao criar escola:", error);
        res.status(500).json({ error: "Falha ao criar escola" });
    }
};

// Obter detalhes de uma escola específica
exports.getSchool = async (req, res) => {
    try {
        const { id } = req.params;

        const school = await School.findByPk(id, {
            include: [
                {
                    model: Address,
                    as: 'Address',
                    required: false
                },
                {
                    model: User,
                    as: 'responsible',
                    attributes: ['id', 'name', 'email', 'phone_number']
                }
            ]
        });

        if (!school) {
            return res.status(404).json({ error: "Escola não encontrada" });
        }

        res.status(200).json(school);
    } catch (error) {
        console.error("Erro ao buscar escola:", error);
        res.status(500).json({ error: "Falha ao buscar escola" });
    }
};

// Atualizar dados da escola
exports.updateSchool = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { id } = req.params;
        const {
            name, cnpj, phone_number, email, website, logo,
            operation_hours, status, plan, notification_radius, address
        } = req.body;

        // Verificar se a escola existe
        const school = await School.findByPk(id);
        if (!school) {
            await transaction.rollback();
            return res.status(404).json({ error: "Escola não encontrada" });
        }

        // Atualizar dados da escola
        const updateData = {};
        if (name) updateData.name = name;
        if (cnpj) updateData.cnpj = cnpj;
        if (phone_number) updateData.phone_number = phone_number;
        if (email) updateData.email = email;
        if (website) updateData.website = website;
        if (logo) updateData.logo = logo;
        if (operation_hours) updateData.operation_hours = operation_hours;
        if (status) updateData.status = status;
        if (plan) updateData.plan = plan;
        if (notification_radius) updateData.notification_radius = notification_radius;

        await school.update(updateData, { transaction });

        // Atualizar ou criar endereço da escola, se fornecido
        if (address) {
            const existingAddress = await Address.findOne({
                where: { school_id: id }
            });

            if (existingAddress) {
                await existingAddress.update(address, { transaction });
            } else {
                await Address.create({
                    ...address,
                    school_id: id
                }, { transaction });
            }
        }

        await transaction.commit();

        res.status(200).json({
            message: "Escola atualizada com sucesso",
            school: await School.findByPk(id)
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Erro ao atualizar escola:", error);
        res.status(500).json({ error: "Falha ao atualizar escola" });
    }
};

// Buscar escolas com filtros
exports.findSchools = async (req, res) => {
    try {
        const { name, status, plan, responsible_user_id } = req.query;

        let whereCondition = {};
        if (name) whereCondition.name = { [Op.like]: `%${name}%` };
        if (status) whereCondition.status = status;
        if (plan) whereCondition.plan = plan;
        if (responsible_user_id) whereCondition.responsible_user_id = responsible_user_id;

        const schools = await School.findAll({
            where: whereCondition,
            include: [
                {
                    model: Address,
                    as: 'Address',
                    required: false
                }
            ]
        });

        res.status(200).json(schools);
    } catch (error) {
        console.error("Erro ao buscar escolas:", error);
        res.status(500).json({ error: "Falha ao buscar escolas" });
    }
};

// Criar uma nova turma para uma escola
exports.createClass = async (req, res) => {
    try {
        const { school_id } = req.params;
        const { name, level, year, period, entry_time, exit_time } = req.body;

        // Verificar se a escola existe
        const school = await School.findByPk(school_id);
        if (!school) {
            return res.status(404).json({ error: "Escola não encontrada" });
        }

        // Criar a turma
        const newClass = await Class.create({
            school_id,
            name,
            level,
            year,
            period,
            entry_time,
            exit_time,
            created_at: new Date()
        });

        res.status(201).json({
            message: "Turma criada com sucesso",
            class: newClass
        });
    } catch (error) {
        console.error("Erro ao criar turma:", error);
        res.status(500).json({ error: "Falha ao criar turma" });
    }
};

// Listar turmas de uma escola
exports.getClassesBySchool = async (req, res) => {
    try {
        const { school_id } = req.params;

        const classes = await Class.findAll({
            where: { school_id }
        });

        res.status(200).json(classes);
    } catch (error) {
        console.error("Erro ao buscar turmas:", error);
        res.status(500).json({ error: "Falha ao buscar turmas" });
    }
};