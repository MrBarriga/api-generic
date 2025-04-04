const express = require("express");
const router = express.Router();
const parkingController = require("../controllers/ParkingController");
const authMiddleware = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /api/parking:
 *   get:
 *     summary: Buscar estacionamentos próximos.
 *     description: Retorna estacionamentos próximos a uma localização.
 *     tags:
 *       - Parking
 *     parameters:
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *           format: float
 *         description: Latitude da localização
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *           format: float
 *         description: Longitude da localização
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *         description: "Raio de busca em metros (padrão: 1000)"
 *     responses:
 *       200:
 *         description: Lista de estacionamentos próximos.
 *       400:
 *         description: Parâmetros inválidos.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/", parkingController.findNearbyParkings);

/**
 * @swagger
 * /api/parking/{id}:
 *   get:
 *     summary: Obter detalhes de um estacionamento.
 *     description: Retorna informações detalhadas de um estacionamento específico.
 *     tags:
 *       - Parking
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do estacionamento
 *     responses:
 *       200:
 *         description: Detalhes do estacionamento.
 *       404:
 *         description: Estacionamento não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/:id", parkingController.getParking);

/**
 * @swagger
 * /api/parking:
 *   post:
 *     summary: Criar novo estacionamento.
 *     description: Registra um novo estacionamento no sistema.
 *     tags:
 *       - Parking
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
 *                 example: "Estacionamento Central"
 *               type:
 *                 type: string
 *                 enum: [COMMERCIAL, RESIDENTIAL, LAND]
 *                 example: "COMMERCIAL"
 *               description:
 *                 type: string
 *                 example: "Estacionamento no centro da cidade"
 *               latitude:
 *                 type: number
 *                 format: float
 *                 example: -23.550520
 *               longitude:
 *                 type: number
 *                 format: float
 *                 example: -46.633308
 *     responses:
 *       201:
 *         description: Estacionamento criado com sucesso.
 *       400:
 *         description: Dados inválidos.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/", authMiddleware, parkingController.createParking);

/**
 * @swagger
 * /api/parking/{id}:
 *   put:
 *     summary: Atualizar estacionamento.
 *     description: Atualiza informações de um estacionamento existente.
 *     tags:
 *       - Parking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do estacionamento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, PENDING_APPROVAL]
 *     responses:
 *       200:
 *         description: Estacionamento atualizado com sucesso.
 *       404:
 *         description: Estacionamento não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.put("/:id", authMiddleware, parkingController.updateParking);

/**
 * @swagger
 * /api/parking/{parking_id}/spots:
 *   post:
 *     summary: Criar nova vaga.
 *     description: Adiciona uma nova vaga a um estacionamento.
 *     tags:
 *       - Parking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parking_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do estacionamento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier:
 *                 type: string
 *                 example: "A-12"
 *               type:
 *                 type: string
 *                 enum: [STANDARD, ACCESSIBLE, SENIOR, ELECTRIC, MOTORCYCLE]
 *                 example: "STANDARD"
 *               price_hour:
 *                 type: number
 *                 example: 10.00
 *     responses:
 *       201:
 *         description: Vaga criada com sucesso.
 *       404:
 *         description: Estacionamento não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/:parking_id/spots", authMiddleware, parkingController.createParkingSpot);

/**
 * @swagger
 * /api/parking/reservations:
 *   post:
 *     summary: Criar reserva.
 *     description: Cria uma nova reserva de vaga.
 *     tags:
 *       - Parking
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               spot_id:
 *                 type: string
 *                 format: uuid
 *               parking_id:
 *                 type: string
 *                 format: uuid
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Reserva criada com sucesso.
 *       400:
 *         description: Dados inválidos ou conflito de horário.
 *       404:
 *         description: Vaga não encontrada.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/reservations", authMiddleware, parkingController.createReservation);

/**
 * @swagger
 * /api/parking/reservations/{reservation_id}/check-in:
 *   post:
 *     summary: Realizar check-in.
 *     description: Registra a entrada em uma reserva.
 *     tags:
 *       - Parking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservation_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da reserva
 *     responses:
 *       200:
 *         description: Check-in realizado com sucesso.
 *       404:
 *         description: Reserva não encontrada.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/reservations/:reservation_id/check-in", authMiddleware, parkingController.checkIn);

/**
 * @swagger
 * /api/parking/reservations/{reservation_id}/check-out:
 *   post:
 *     summary: Realizar check-out.
 *     description: Registra a saída e finaliza uma reserva.
 *     tags:
 *       - Parking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservation_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da reserva
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payment_info:
 *                 type: object
 *     responses:
 *       200:
 *         description: Check-out realizado com sucesso.
 *       404:
 *         description: Reserva não encontrada.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/reservations/:reservation_id/check-out", authMiddleware, parkingController.checkOut);

/**
 * @swagger
 * /api/parking/reservations/{reservation_id}/cancel:
 *   post:
 *     summary: Cancelar reserva.
 *     description: Cancela uma reserva existente.
 *     tags:
 *       - Parking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservation_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da reserva
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reserva cancelada com sucesso.
 *       404:
 *         description: Reserva não encontrada.
 *       500:
 *         description: Erro interno do servidor.
 */
router.post("/reservations/:reservation_id/cancel", authMiddleware, parkingController.cancelReservation);

/**
 * @swagger
 * /api/parking/user/{user_id}/reservations:
 *   get:
 *     summary: Listar reservas do usuário.
 *     description: Retorna todas as reservas de um usuário.
 *     tags:
 *       - Parking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SCHEDULED, ACTIVE, COMPLETED, CANCELLED, EXPIRED]
 *         description: Filtrar por status
 *     responses:
 *       200:
 *         description: Lista de reservas.
 *       404:
 *         description: Usuário não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/user/:user_id/reservations", authMiddleware, parkingController.getUserReservations);

module.exports = router;