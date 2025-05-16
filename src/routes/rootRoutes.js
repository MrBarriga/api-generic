const express = require("express");
const router = express.Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Verifica se a API está online
 *     description: Retorna um status da API
 *     responses:
 *       200:
 *         description: API rodando normalmente
 */
router.get("/", (req, res) => {
  res.json({
    status: "🔥 API Podevim está rodando!",
    version: "1.0.0",
    docs: "/api-docs",
  });
});

module.exports = router;
