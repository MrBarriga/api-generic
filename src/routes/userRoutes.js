const express = require("express");
const router = express.Router();
const {
    updateUser,
    requestPasswordReset,
    resetPassword,
    getUser,
    updateUserStatus,
    getUserById,
    setupTwoFactor,
    verifyTwoFactor,
    updatePassword
} = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const { roleMiddleware } = require("../middlewares/roleMiddleware");
const { validatePasswordReset, validateStatusUpdate } = require("../middlewares/validationMiddleware");

/**
 * @swagger
 * /api/user/request-password-reset:
 *   post:
 *     summary: Solicitar redefinição de senha.
 *     description: Gera um token e envia um e-mail com um link para redefinir a senha.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "usuario@exemplo.com"
 *     responses:
 *       200:
 *         description: E-mail de redefinição de senha enviado.
 *       404:
 *         description: Usuário não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/request-password-reset", requestPasswordReset);

/**
 * @swagger
 * /api/user/reset-password:
 *   post:
 *     summary: Redefinir senha usando token.
 *     description: Redefine a senha de um usuário usando um token válido.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: "ab123c4d5ef6789g0h1i2j3k4l5m6n7o8p9"
 *               newPassword:
 *                 type: string
 *                 example: "NovaSenha123"
 *     responses:
 *       200:
 *         description: Senha redefinida com sucesso.
 *       400:
 *         description: Token inválido ou expirado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/reset-password", validatePasswordReset, resetPassword);

/**
 * @swagger
 * /api/user/update-password:
 *   put:
 *     summary: Atualizar senha.
 *     description: Permite ao usuário logado atualizar sua senha.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "SenhaAtual123"
 *               newPassword:
 *                 type: string
 *                 example: "NovaSenha456"
 *     responses:
 *       200:
 *         description: Senha atualizada com sucesso.
 *       401:
 *         description: Senha atual incorreta.
 *       500:
 *         description: Erro interno do servidor.
 */
router.put("/update-password", authMiddleware, updatePassword);

/**
 * @swagger
 * /api/user/update-user:
 *   put:
 *     summary: Atualizar informações do usuário.
 *     description: Atualiza os dados do usuário autenticado.
 *     tags:
 *       - Users
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
 *                 example: "João Silva"
 *               email:
 *                 type: string
 *                 example: "usuario@exemplo.com"
 *               phone_number:
 *                 type: string
 *                 example: "123456789"
 *               profile_photo:
 *                 type: string
 *                 example: "https://exemplo.com/foto.jpg"
 *               device_token:
 *                 type: string
 *                 example: "f7sd6fs76df87s6df87s6d8f76"
 *               preferences:
 *                 type: object
 *                 example: {"theme": "dark", "notifications": true}
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso.
 *       404:
 *         description: Usuário não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.put("/update-user", authMiddleware, updateUser);

/**
 * @swagger
 * /api/user/update-status:
 *   put:
 *     summary: Atualizar status do usuário.
 *     description: Altera o status de um usuário (ativo, inativo, suspenso).
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, SUSPENDED]
 *                 example: "ACTIVE"
 *     responses:
 *       200:
 *         description: Status do usuário atualizado com sucesso.
 *       400:
 *         description: Status inválido.
 *       404:
 *         description: Usuário não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.put("/update-status", [authMiddleware, roleMiddleware(['ADMIN'])], validateStatusUpdate, updateUserStatus);

/**
 * @swagger
 * /api/user/get:
 *   get:
 *     summary: Buscar usuários por filtros.
 *     description: Permite buscar usuários usando diversos atributos.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Nome do usuário
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: E-mail do usuário
 *       - in: query
 *         name: phone_number
 *         schema:
 *           type: string
 *         description: Número de telefone do usuário
 *       - in: query
 *         name: user_type
 *         schema:
 *           type: string
 *           enum: [ADMIN, SCHOOL, PARENT, STUDENT, PARKING_PROVIDER]
 *         description: Tipo de usuário
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, SUSPENDED]
 *         description: Status do usuário
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários encontrados.
 *       400:
 *         description: Nenhum parâmetro de busca fornecido.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/get", [authMiddleware, roleMiddleware(['ADMIN'])], getUser);

/**
 * @swagger
 * /api/user/{id}:
 *   get:
 *     summary: Obter usuário por ID.
 *     description: Busca um usuário específico pelo seu ID.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuário encontrado.
 *       404:
 *         description: Usuário não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/:id", authMiddleware, getUserById);

/**
 * @swagger
 * /api/user/setup-2fa:
 *   post:
 *     summary: Configurar autenticação de dois fatores.
 *     description: Inicia o processo de configuração de autenticação de dois fatores.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuração de 2FA iniciada.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/setup-2fa", authMiddleware, setupTwoFactor);

/**
 * @swagger
 * /api/user/verify-2fa:
 *   post:
 *     summary: Verificar código de autenticação de dois fatores.
 *     description: Verifica um código de autenticação de dois fatores.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Código verificado com sucesso.
 *       400:
 *         description: Configuração de 2FA não encontrada.
 *       401:
 *         description: Código inválido.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/verify-2fa", verifyTwoFactor);

module.exports = router;