const Student = require("../models/Student");
const StudentGuardian = require("../models/StudentGuardian");
const User = require("../models/User");
const School = require("../models/School");
const Class = require("../models/Class");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

// Criar um novo aluno
exports.createStudent = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const {
            name, birth_date, photo, class_id, school_id,
            user_id, special_needs, notes, guardians
        } = req.body;

        // Verificar se a escola existe
        const school = await School.findByPk(school_id);
        if (!school) {
            await transaction.rollback();
            return res.status(404).json({ error: "Escola não encontrada" });
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
            return res.status(404).json({ error: "Turma não encontrada ou não pertence a esta escola" });
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
                    return res.status(404).json({
                        error: `Responsável com ID ${guardian.user_id} não encontrado ou não é do tipo responsável`
                    });
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

        res.status(201).json({
            message: "Aluno criado com sucesso",
            student
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Erro ao criar aluno:", error);
        res.status(500).json({ error: "Falha ao criar aluno" });
    }
};

// Obter detalhes de um aluno específico
exports.getStudent = async (req, res) => {
    try {
        const { id } = req.params;

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
            return res.status(404).json({ error: "Aluno não encontrado" });
        }

        res.status(200).json(student);
    } catch (error) {
        console.error("Erro ao buscar aluno:", error);
        res.status(500).json({ error: "Falha ao buscar aluno" });
    }
};

// Atualizar dados do aluno
exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, birth_date, photo, class_id,
            special_needs, notes, exit_status
        } = req.body;

        // Verificar se o aluno existe
        const student = await Student.findByPk(id);
        if (!student) {
            return res.status(404).json({ error: "Aluno não encontrado" });
        }

        // Se class_id foi fornecido, verificar se a turma existe e pertence à mesma escola
        if (class_id) {
            const classEntity = await Class.findOne({
                where: {
                    id: class_id,
                    school_id: student.school_id
                }
            });

            if (!classEntity) {
                return res.status(404).json({ error: "Turma não encontrada ou não pertence a esta escola" });
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

        res.status(200).json({
            message: "Aluno atualizado com sucesso",
            student: await Student.findByPk(id)
        });
    } catch (error) {
        console.error("Erro ao atualizar aluno:", error);
        res.status(500).json({ error: "Falha ao atualizar aluno" });
    }
};

// Adicionar um responsável ao aluno
exports.addGuardian = async (req, res) => {
    try {
        const { student_id } = req.params;
        const { user_id, relation, is_primary, can_pickup, end_date } = req.body;

        // Verificar se o aluno existe
        const student = await Student.findByPk(student_id);
        if (!student) {
            return res.status(404).json({ error: "Aluno não encontrado" });
        }

        // Verificar se o usuário existe e é do tipo PAI/RESPONSÁVEL
        const user = await User.findOne({
            where: {
                id: user_id,
                user_type: 'PARENT'
            }
        });

        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado ou não é do tipo responsável" });
        }

        // Verificar se este responsável já está vinculado ao aluno
        const existingGuardian = await StudentGuardian.findOne({
            where: {
                student_id,
                user_id
            }
        });

        if (existingGuardian) {
            return res.status(400).json({ error: "Este responsável já está vinculado ao aluno" });
        }

        // Se é o responsável principal, atualizar os outros para não serem principais
        if (is_primary) {
            await StudentGuardian.update(
                { is_primary: false },
                { where: { student_id, is_primary: true } }
            );
        }

        // Criar o vínculo com o responsável
        const guardian = await StudentGuardian.create({
            student_id,
            user_id,
            relation,
            is_primary: is_primary || false,
            verified: false,  // Novo vínculo sempre começa como não verificado
            can_pickup: can_pickup !== undefined ? can_pickup : true,
            start_date: new Date(),
            end_date: end_date || null,
            created_at: new Date()
        });

        res.status(201).json({
            message: "Responsável adicionado com sucesso",
            guardian
        });
    } catch (error) {
        console.error("Erro ao adicionar responsável:", error);
        res.status(500).json({ error: "Falha ao adicionar responsável" });
    }
};

// Remover um responsável do aluno
exports.removeGuardian = async (req, res) => {
    try {
        const { student_id, guardian_id } = req.params;

        // Verificar se o vínculo existe
        const guardian = await StudentGuardian.findOne({
            where: {
                id: guardian_id,
                student_id
            }
        });

        if (!guardian) {
            return res.status(404).json({ error: "Vínculo de responsável não encontrado" });
        }

        // Remover o vínculo
        await guardian.destroy();

        res.status(200).json({
            message: "Responsável removido com sucesso"
        });
    } catch (error) {
        console.error("Erro ao remover responsável:", error);
        res.status(500).json({ error: "Falha ao remover responsável" });
    }
};

// Listar alunos por turma
exports.getStudentsByClass = async (req, res) => {
    try {
        const { class_id } = req.params;

        const students = await Student.findAll({
            where: { class_id },
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

        res.status(200).json(students);
    } catch (error) {
        console.error("Erro ao listar alunos por turma:", error);
        res.status(500).json({ error: "Falha ao listar alunos" });
    }
};

// Listar alunos por escola
exports.getStudentsBySchool = async (req, res) => {
    try {
        const { school_id } = req.params;
        const { name, class_id, exit_status } = req.query;

        let whereCondition = { school_id };
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

        res.status(200).json(students);
    } catch (error) {
        console.error("Erro ao listar alunos por escola:", error);
        res.status(500).json({ error: "Falha ao listar alunos" });
    }
};