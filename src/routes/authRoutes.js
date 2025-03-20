const express = require("express");
const router = express.Router();
const userService = require("../controllers/userService");
const authController = require("../controllers/authController");

/**
 * @swagger
 * /api/user/register:
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

// Rota de login
router.post("/login", userService.login);

// Rota para atualizar o token de acesso usando o refresh token
router.post("/refresh-token", userService.refreshToken);

module.exports = router;
