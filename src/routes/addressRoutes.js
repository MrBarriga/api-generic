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
 * /api/address/update:
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
 *       200:
 *         description: Endereço atualizado com sucesso
 */
router.put("/update-address", authMiddleware, addressController.updateAddress);

module.exports = router;
