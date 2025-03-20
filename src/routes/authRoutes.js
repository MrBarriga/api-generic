const express = require("express");
const router = express.Router();
const userService = require("../controllers/userService");
const authController = require("../controllers/authController");

/**
 * @swagger
<<<<<<< HEAD
 * /api/user/register:
=======
 * /api/auth/register:
>>>>>>> development
 *   post:
 *     summary: Criar um novo usuário.
 *     description: Registra um novo usuário com nome, sobrenome, e-mail e senha.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "João"
 *               last_name:
 *                 type: string
 *                 example: "Silva"
 *               email:
 *                 type: string
 *                 example: "joao@email.com"
 *               password:
 *                 type: string
 *                 example: "SenhaForte123"
 *               empresa:
 *                 type: string
 *                 example: "ITAU"
 *               phone_number:
 *                 type: string
 *                 example: "11999999999"
 *               pro_number:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso.
 *       400:
 *         description: Usuário já existe.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/register", async (req, res) => {
  try {
    const newUser = await userService.createUser(req.body);
    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Autenticar usuário.
 *     description: Permite que um usuário faça login e receba um token JWT.
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
 *                 example: "joao@email.com"
 *               password:
 *                 type: string
 *                 example: "SenhaForte123"
 *     responses:
 *       200:
 *         description: Login realizado com sucesso.
 *       401:
 *         description: Credenciais inválidas.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/login", userService.login);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Atualizar token de acesso.
 *     description: Gera um novo token de acesso usando um refresh token válido.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "abcd1234efgh5678"
 *     responses:
 *       200:
 *         description: Novo token de acesso gerado.
 *       401:
 *         description: Refresh token inválido.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/refresh-token", userService.refreshToken);

module.exports = router;
