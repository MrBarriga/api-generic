const User = require("../models/User");

/**
 * Middleware for role-based authorization
 * @param {Array} allowedRoles - Array of allowed user types
 * @returns {Function} Middleware function
 */
exports.roleMiddleware = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;

            // Find user from database to get up-to-date role info
            const user = await User.findByPk(userId);

            if (!user) {
                return res.status(404).json({ error: "Usuário não encontrado" });
            }

            // Check if user type is in the allowed roles
            if (!allowedRoles.includes(user.user_type)) {
                return res.status(403).json({
                    error: "Acesso negado. Você não tem permissão para acessar este recurso."
                });
            }

            // Add user type to the request for potential further use
            req.userType = user.user_type;

            next();
        } catch (error) {
            console.error("Erro ao verificar permissão:", error);
            res.status(500).json({ error: "Erro interno do servidor" });
        }
    };
};