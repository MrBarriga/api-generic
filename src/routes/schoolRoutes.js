const express = require("express");
const router = express.Router();
const schoolController = require("../controllers/SchoolController");
const authMiddleware = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /api/school:
 *   get:
 *     summary: Listar escolas.
 *     description: Busca escolas com filtros opcionais.
 *     tags:
 *       - Schools
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Nome da escola
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, PENDING]
 *         description: Status da escola
 *     responses:
 *       200:
 *         description: Lista de escolas.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/", schoolController.findSchools);

/**
 * @swagger
 * /api/school/{id}:
 *   get:
 *     summary: Obter detalhes de uma escola.
 *     description: Retorna informações detalhadas de uma escola específica.
 *     tags:
 *       - Schools
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da escola
 *     responses:
 *       200:
 *         description: Detalhes da escola.
 *       404:
 *         description: Escola não encontrada.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/:id", schoolController.getSchool);

/**
 * @swagger
 * /api/school:
 *   post:
 *     summary: Criar nova escola.
 *     description: Registra uma nova escola no sistema.
 *     tags:
 *       - Schools
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Escola Modelo"
 *               cnpj:
 *                 type: string
 *                 example: "12.345.678/0001-90"
 *               email:
 *                 type: string
 *                 example: "contato@escolamodelo.edu.br"
 *               phone_number:
 *                 type: string
 *                 example: "1123456789"
 *               responsible_user_id:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       201:
 *         description: Escola criada com sucesso.
 *       400:
 *         description: Dados inválidos.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/", authMiddleware, schoolController.createSchool);

/**
 * @swagger
 * /api/school/{id}:
 *   put:
 *     summary: Atualizar escola.
 *     description: Atualiza informações de uma escola existente.
 *     tags:
 *       - Schools
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da escola
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, PENDING]
 *               plan:
 *                 type: string
 *                 enum: [BASIC, PREMIUM, ENTERPRISE]
 *     responses:
 *       200:
 *         description: Escola atualizada com sucesso.
 *       404:
 *         description: Escola não encontrada.
 *       500:
 *         description: Erro interno do servidor.
 */
router.put("/:id", authMiddleware, schoolController.updateSchool);

/**
 * @swagger
 * /api/school/{school_id}/classes:
 *   post:
 *     summary: Criar nova turma.
 *     description: Adiciona uma nova turma a uma escola.
 *     tags:
 *       - Schools
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: school_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da escola
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "5º Ano A"
 *               level:
 *                 type: string
 *                 example: "Fundamental I"
 *               period:
 *                 type: string
 *                 enum: [MORNING, AFTERNOON, FULL_TIME]
 *                 example: "MORNING"
 *     responses:
 *       201:
 *         description: Turma criada com sucesso.
 *       404:
 *         description: Escola não encontrada.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/:school_id/classes", authMiddleware, schoolController.createClass);

/**
 * @swagger
 * /api/school/{school_id}/classes:
 *   get:
 *     summary: Listar turmas de uma escola.
 *     description: Retorna todas as turmas de uma escola específica.
 *     tags:
 *       - Schools
 *     parameters:
 *       - in: path
 *         name: school_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da escola
 *     responses:
 *       200:
 *         description: Lista de turmas.
 *       404:
 *         description: Escola não encontrada.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/:school_id/classes", schoolController.getClassesBySchool);

module.exports = router;