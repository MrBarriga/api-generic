const express = require("express");
const router = express.Router();
const userService = require("../services/userService");
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const { validateRegistration, validateLogin } = require("../middlewares/validationMiddleware");

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Criar um novo usuário.
 *     description: Registra um novo usuário com os dados necessários.
 *     tags:
 *       - Authentication
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
 *                 example: "joao@email.com"
 *               password:
 *                 type: string
 *                 example: "SenhaForte123"
 *               phone_number:
 *                 type: string
 *                 example: "11999999999"
 *               user_type:
 *                 type: string
 *                 enum: [ADMIN, SCHOOL, PARENT, STUDENT, PARKING_PROVIDER]
 *                 example: "PARENT"
 *               preferences:
 *                 type: object
 *                 example: {"theme": "light", "notifications": true}
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso.
 *       400:
 *         description: Usuário já existe ou dados inválidos.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/register", validateRegistration, async (req, res) => {
  try {
    const newUser = await userService.createUser(req.body);
    res.status(201).json({ message: "Usuário registrado com sucesso", user: newUser });
  } catch (error) {
    if (error.message.includes("já existe")) {
      return res.status(400).json({ error: error.message });
    }
    console.error("Erro ao registrar usuário:", error);
    res.status(500).json({ error: "Falha ao registrar usuário. Por favor, tente novamente." });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Autenticar usuário.
 *     description: Permite que um usuário faça login e receba tokens de acesso e refresh.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "joao@email.com"
 *               password:
 *                 type: string
 *                 example: "SenhaForte123"
 *     responses:
 *       200:
 *         description: Login realizado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 requires2FA:
 *                   type: boolean
 *                 user:
 *                   type: object
 *       401:
 *         description: Credenciais inválidas.
 *       403:
 *         description: Conta inativa ou suspensa.
 *       404:
 *         description: Usuário não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/login", validateLogin, authController.login);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Atualizar token de acesso.
 *     description: Gera um novo token de acesso usando um refresh token válido.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx"
 *     responses:
 *       200:
 *         description: Novo token de acesso gerado.
 *       401:
 *         description: Refresh token não fornecido.
 *       403:
 *         description: Refresh token inválido ou expirado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/refresh-token", authController.refreshToken);

/**
 * @swagger
 * /api/auth/verify-2fa:
 *   post:
 *     summary: Verificar código de autenticação de dois fatores.
 *     description: Verifica um código de autenticação de dois fatores após o login.
 *     tags:
 *       - Authentication
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
 *       401:
 *         description: Código inválido.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/verify-2fa", authController.verifyTwoFactor);

/**
 * @swagger
 * /api/auth/setup-2fa:
 *   post:
 *     summary: Configurar autenticação de dois fatores.
 *     description: Inicia o processo de configuração de autenticação de dois fatores.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuração de 2FA iniciada.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/setup-2fa", authMiddleware, authController.setupTwoFactor);

/**
 * @swagger
 * /api/auth/enable-2fa:
 *   post:
 *     summary: Ativar autenticação de dois fatores.
 *     description: Ativa a autenticação de dois fatores após verificação do código inicial.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Autenticação de dois fatores ativada com sucesso.
 *       401:
 *         description: Código inválido.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/enable-2fa", authMiddleware, authController.enableTwoFactor);

/**
 * @swagger
 * /api/auth/disable-2fa:
 *   post:
 *     summary: Desativar autenticação de dois fatores.
 *     description: Desativa a autenticação de dois fatores para a conta do usuário.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Autenticação de dois fatores desativada com sucesso.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/disable-2fa", authMiddleware, authController.disableTwoFactor);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Fazer logout do sistema.
 *     description: Invalida o refresh token do usuário, efetivamente realizando logout.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso.
 *       401:
 *         description: Não autorizado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/logout", authMiddleware, authController.logout);

module.exports = router;