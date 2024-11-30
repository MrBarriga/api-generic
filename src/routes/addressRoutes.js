const express = require("express");
const addressController = require("../controllers/addressController");
const updateAddress = require("../controllers/addressController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

/**
 * @swagger
 * /api/address/add:
 *   post:
 *     summary: Adicionar endereço
 *     tags: [Address]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: ID do usuário
 *               line1:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               postal_code:
 *                 type: string
 *               country:
 *                 type: string
 *     responses:
 *       201:
 *         description: Endereço adicionado com sucesso
 */
router.post("/add", authMiddleware, addressController.createAddress);

/**
 * @swagger
 * /api/address/update-address:
 *   put:
 *     summary: Atualizar endereço
 *     tags: [Address]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address_id:
 *                 type: integer
 *                 description: ID do endereço
 *                 example: 4
 *               user_id:
 *                 type: string
 *                 description: ID do usuário associado ao endereço
 *                 example: "ITAU3"
 *               line1:
 *                 type: string
 *                 description: Primeira linha do endereço
 *                 example: "Teste novo2"
 *               line2:
 *                 type: string
 *                 description: Segunda linha do endereço (opcional)
 *                 example: "Teste novo2"
 *               city:
 *                 type: string
 *                 description: Cidade
 *                 example: "Teste novo2"
 *               state:
 *                 type: string
 *                 description: Estado
 *                 example: "Teste novo2"
 *               postal_code:
 *                 type: string
 *                 description: Código postal
 *                 example: "10001222"
 *               country:
 *                 type: string
 *                 description: País
 *                 example: "USA"
 *     responses:
 *       200:
 *         description: Endereço atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Address updated successfully"
 *                 address:
 *                   type: object
 *                   properties:
 *                     address_id:
 *                       type: integer
 *                       example: 4
 *                     user_id:
 *                       type: string
 *                       example: "ITAU3"
 *                     line1:
 *                       type: string
 *                       example: "Teste novo2"
 *                     line2:
 *                       type: string
 *                       example: "Teste novo2"
 *                     city:
 *                       type: string
 *                       example: "Teste novo2"
 *                     state:
 *                       type: string
 *                       example: "Teste novo2"
 *                     postal_code:
 *                       type: string
 *                       example: "10001222"
 *                     country:
 *                       type: string
 *                       example: "USA"
 *       404:
 *         description: Endereço não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Address not found"
 *       401:
 *         description: Token inválido ou não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid token"
 *       500:
 *         description: Falha ao atualizar o endereço
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to update address"
 */
router.put("/update-address", authMiddleware, addressController.updateAddress);

module.exports = router;
