const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Middleware to authenticate and validate JWT tokens
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get the token from the authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Acesso negado. Token não fornecido." });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Acesso negado. Token inválido." });
    }

    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user
      const user = await User.findByPk(decoded.id);

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Check user status
      if (user.status === "SUSPENDED") {
        return res.status(403).json({ error: "Conta suspensa. Entre em contato com o suporte." });
      }

      if (user.status === "INACTIVE") {
        return res.status(403).json({ error: "Conta inativa. Por favor, ative sua conta." });
      }

      // Add user info to request
      req.user = {
        id: user.id,
        email: user.email,
        user_type: user.user_type
      };

      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Token expirado. Por favor, faça login novamente." });
      }

      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ error: "Token inválido. Por favor, faça login novamente." });
      }

      throw error;
    }
  } catch (error) {
    console.error("Erro de autenticação:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

module.exports = authMiddleware;