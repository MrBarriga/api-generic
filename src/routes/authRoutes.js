const express = require("express");
const router = express.Router();
const userService = require("../controllers/userService");
const authController = require("../controllers/authController");

// Rota de registro
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
