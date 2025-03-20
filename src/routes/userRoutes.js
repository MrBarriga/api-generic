const express = require("express");
const router = express.Router();
const { updateUser, requestPasswordReset, resetPassword, getUser } = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

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
 *                 example: "AB1234"
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
router.post("/reset-password", resetPassword);

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
 *                 example: "João"
 *               last_name:
 *                 type: string
 *                 example: "Silva"
 *               email:
 *                 type: string
 *                 example: "usuario@exemplo.com"
 *               phone_number:
 *                 type: string
 *                 example: "123456789"
 *               pro_number:
 *                 type: string
 *                 example: "987654321"
 *               photo:
 *                 type: string
 *                 example: "https://exemplo.com/foto.jpg"
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
 * /api/user/get:
 *   get:
 *     summary: Buscar usuários por nome, sobrenome, e-mail ou telefone.
 *     description: Permite buscar usuários usando qualquer um desses atributos.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Nome do usuário
 *       - in: query
 *         name: last_name
 *         schema:
 *           type: string
 *         description: Sobrenome do usuário
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
 *     responses:
 *       200:
 *         description: Lista de usuários encontrados.
 *       400:
 *         description: Nenhum parâmetro de busca fornecido.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/get", getUser);

module.exports = router;
