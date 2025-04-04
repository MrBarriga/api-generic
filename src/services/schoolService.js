const School = require('../models/School');
const Address = require('../models/Address');
const Class = require('../models/Class');
const User = require('../models/User');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Criar uma nova escola
 */
async function createSchool(schoolData) {
    const transaction = await sequelize.transaction();

    try {
        const {
            name, cnpj, phone_number, email, website, logo,
            operation_hours, responsible_user_id, address, plan
        } = schoolData;

        // Verificar se responsável existe e é do tipo SCHOOL
        const responsibleUser = await User.findOne({
            where: {
                id: responsible_user_id,
                user_type: 'SCHOOL'
            }
        });

        if (!responsibleUser) {
            await transaction.rollback();
            throw new Error("Responsável não encontrado ou não possui permissões de escola");
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
        return school;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

/**
 * Obter escola por ID
 */
async function getSchoolById(id) {
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
        throw new Error("Escola não encontrada");
    }

    return school;
}

/**
 * Atualizar dados da escola
 */
async function updateSchool(id, schoolData) {
    const transaction = await sequelize.transaction();

    try {
        const {
            name, cnpj, phone_number, email, website, logo,
            operation_hours, status, plan, notification_radius, address
        } = schoolData;

        // Verificar se a escola existe
        const school = await School.findByPk(id);
        if (!school) {
            await transaction.rollback();
            throw new Error("Escola não encontrada");
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
        return await School.findByPk(id);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

/**
 * Buscar escolas com filtros
 */
async function findSchools(filters) {
    const { name, status, plan, responsible_user_id } = filters;

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

    return schools;
}

/**
 * Criar uma turma para uma escola
 */
async function createClass(schoolId, classData) {
    const { name, level, year, period, entry_time, exit_time } = classData;

    // Verificar se a escola existe
    const school = await School.findByPk(schoolId);
    if (!school) {
        throw new Error("Escola não encontrada");
    }

    // Criar a turma
    const newClass = await Class.create({
        school_id: schoolId,
        name,
        level,
        year,
        period,
        entry_time,
        exit_time,
        created_at: new Date()
    });

    return newClass;
}

/**
 * Listar turmas de uma escola
 */
async function getClassesBySchool(schoolId) {
    const classes = await Class.findAll({
        where: { school_id: schoolId }
    });

    return classes;
}

module.exports = {
    createSchool,
    getSchoolById,
    updateSchool,
    findSchools,
    createClass,
    getClassesBySchool
};