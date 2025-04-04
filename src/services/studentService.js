const Student = require('../models/Student');
const StudentGuardian = require('../models/StudentGuardian');
const User = require('../models/User');
const School = require('../models/School');
const Class = require('../models/Class');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Criar um novo aluno
 */
async function createStudent(studentData) {
    const transaction = await sequelize.transaction();

    try {
        const {
            name, birth_date, photo, class_id, school_id,
            user_id, special_needs, notes, guardians
        } = studentData;

        // Verificar se a escola existe
        const school = await School.findByPk(school_id);
        if (!school) {
            await transaction.rollback();
            throw new Error("Escola não encontrada");
        }

        // Verificar se a turma existe e pertence à escola
        const classEntity = await Class.findOne({
            where: {
                id: class_id,
                school_id
            }
        });

        if (!classEntity) {
            await transaction.rollback();
            throw new Error("Turma não encontrada ou não pertence a esta escola");
        }

        // Criar o aluno
        const student = await Student.create({
            name,
            birth_date,
            photo,
            class_id,
            school_id,
            user_id,
            special_needs,
            notes,
            exit_status: 'AT_SCHOOL',
            created_at: new Date()
        }, { transaction });

        // Adicionar responsáveis, se fornecidos
        if (guardians && guardians.length > 0) {
            for (const guardian of guardians) {
                // Verificar se o usuário existe e é do tipo PAI/RESPONSÁVEL
                const user = await User.findOne({
                    where: {
                        id: guardian.user_id,
                        user_type: 'PARENT'
                    }
                });

                if (!user) {
                    await transaction.rollback();
                    throw new Error(`Responsável com ID ${guardian.user_id} não encontrado ou não é do tipo responsável`);
                }

                await StudentGuardian.create({
                    student_id: student.id,
                    user_id: guardian.user_id,
                    relation: guardian.relation,
                    is_primary: guardian.is_primary || false,
                    verified: guardian.verified || false,
                    can_pickup: guardian.can_pickup !== undefined ? guardian.can_pickup : true,
                    start_date: new Date(),
                    end_date: guardian.end_date || null,
                    created_at: new Date()
                }, { transaction });
            }
        }

        await transaction.commit();
        return student;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

/**
 * Obter aluno por ID
 */
async function getStudentById(id) {
    const student = await Student.findByPk(id, {
        include: [
            {
                model: Class,
                attributes: ['id', 'name', 'level', 'period']
            },
            {
                model: School,
                attributes: ['id', 'name']
            },
            {
                model: StudentGuardian,
                include: [
                    {
                        model: User,
                        attributes: ['id', 'name', 'email', 'phone_number', 'profile_photo']
                    }
                ]
            }
        ]
    });

    if (!student) {
        throw new Error("Aluno não encontrado");
    }

    return student;
}

/**
 * Atualizar dados do aluno
 */
async function updateStudent(id, studentData) {
    // Verificar se o aluno existe
    const student = await Student.findByPk(id);
    if (!student) {
        throw new Error("Aluno não encontrado");
    }

    const {
        name, birth_date, photo, class_id,
        special_needs, notes, exit_status
    } = studentData;

    // Se class_id foi fornecido, verificar se a turma existe e pertence à mesma escola
    if (class_id) {
        const classEntity = await Class.findOne({
            where: {
                id: class_id,
                school_id: student.school_id
            }
        });

        if (!classEntity) {
            throw new Error("Turma não encontrada ou não pertence a esta escola");
        }
    }

    // Atualizar dados do aluno
    const updateData = {};
    if (name) updateData.name = name;
    if (birth_date) updateData.birth_date = birth_date;
    if (photo) updateData.photo = photo;
    if (class_id) updateData.class_id = class_id;
    if (special_needs !== undefined) updateData.special_needs = special_needs;
    if (notes !== undefined) updateData.notes = notes;
    if (exit_status) updateData.exit_status = exit_status;

    await student.update(updateData);
    return await Student.findByPk(id);
}

/**
 * Adicionar um responsável ao aluno
 */
async function addGuardian(studentId, guardianData) {
    const { user_id, relation, is_primary, can_pickup, end_date } = guardianData;

    // Verificar se o aluno existe
    const student = await Student.findByPk(studentId);
    if (!student) {
        throw new Error("Aluno não encontrado");
    }

    // Verificar se o usuário existe e é do tipo PAI/RESPONSÁVEL
    const user = await User.findOne({
        where: {
            id: user_id,
            user_type: 'PARENT'
        }
    });

    if (!user) {
        throw new Error("Usuário não encontrado ou não é do tipo responsável");
    }

    // Verificar se este responsável já está vinculado ao aluno
    const existingGuardian = await StudentGuardian.findOne({
        where: {
            student_id: studentId,
            user_id
        }
    });

    if (existingGuardian) {
        throw new Error("Este responsável já está vinculado ao aluno");
    }

    // Se é o responsável principal, atualizar os outros para não serem principais
    if (is_primary) {
        await StudentGuardian.update(
            { is_primary: false },
            { where: { student_id: studentId, is_primary: true } }
        );
    }

    // Criar o vínculo com o responsável
    const guardian = await StudentGuardian.create({
        student_id: studentId,
        user_id,
        relation,
        is_primary: is_primary || false,
        verified: false,  // Novo vínculo sempre começa como não verificado
        can_pickup: can_pickup !== undefined ? can_pickup : true,
        start_date: new Date(),
        end_date: end_date || null,
        created_at: new Date()
    });

    return guardian;
}

/**
 * Remover um responsável do aluno
 */
async function removeGuardian(studentId, guardianId) {
    // Verificar se o vínculo existe
    const guardian = await StudentGuardian.findOne({
        where: {
            id: guardianId,
            student_id: studentId
        }
    });

    if (!guardian) {
        throw new Error("Vínculo de responsável não encontrado");
    }

    // Remover o vínculo
    await guardian.destroy();
    return true;
}

/**
 * Listar alunos por turma
 */
async function getStudentsByClass(classId) {
    const students = await Student.findAll({
        where: { class_id: classId },
        include: [
            {
                model: StudentGuardian,
                include: [
                    {
                        model: User,
                        attributes: ['id', 'name', 'phone_number']
                    }
                ]
            }
        ]
    });

    return students;
}

/**
 * Listar alunos por escola
 */
async function getStudentsBySchool(schoolId, filters = {}) {
    const { name, class_id, exit_status } = filters;

    let whereCondition = { school_id: schoolId };
    if (name) whereCondition.name = { [Op.like]: `%${name}%` };
    if (class_id) whereCondition.class_id = class_id;
    if (exit_status) whereCondition.exit_status = exit_status;

    const students = await Student.findAll({
        where: whereCondition,
        include: [
            {
                model: Class,
                attributes: ['id', 'name']
            }
        ]
    });

    return students;
}

/**
 * Listar alunos por responsável
 */
async function getStudentsByGuardian(guardianId) {
    const guardianRelations = await StudentGuardian.findAll({
        where: { user_id: guardianId },
        include: [
            {
                model: Student,
                include: [
                    {
                        model: Class,
                        attributes: ['id', 'name']
                    },
                    {
                        model: School,
                        attributes: ['id', 'name']
                    }
                ]
            }
        ]
    });

    // Extrair apenas os alunos das relações
    const students = guardianRelations.map(relation => relation.Student);
    return students;
}

module.exports = {
    createStudent,
    getStudentById,
    updateStudent,
    addGuardian,
    removeGuardian,
    getStudentsByClass,
    getStudentsBySchool,
    getStudentsByGuardian
};