const express = require("express");
const router = express.Router();
const { updateUser } = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const { requestPasswordReset, resetPassword } = require("../controllers/userController");


// Rota para solicitar o reset de senha (gera o token e envia o link)
router.post("/request-password-reset", requestPasswordReset);

// Rota para resetar a senha com o token
router.post("/reset-password", resetPassword);

// Endpoint para atualizar o usuário
router.put("/update-user", authMiddleware, updateUser);

module.exports = router;
