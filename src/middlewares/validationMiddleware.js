/**
 * Middleware for validating user registration data
 */
exports.validateRegistration = (req, res, next) => {
    const { name, email, password, user_type } = req.body;
    const errors = [];

    // Check required fields
    if (!name) errors.push("Nome é obrigatório");
    if (!email) errors.push("Email é obrigatório");
    if (!password) errors.push("Senha é obrigatória");

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
        errors.push("Formato de email inválido");
    }

    // Validate password strength
    if (password && password.length < 8) {
        errors.push("A senha deve ter pelo menos 8 caracteres");
    }

    // Validate user type if provided
    if (user_type) {
        const validTypes = ["ADMIN", "SCHOOL", "PARENT", "STUDENT", "PARKING_PROVIDER"];
        if (!validTypes.includes(user_type)) {
            errors.push("Tipo de usuário inválido");
        }
    }

    // Return errors if any
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    next();
};

/**
 * Middleware for validating login data
 */
exports.validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email) errors.push("Email é obrigatório");
    if (!password) errors.push("Senha é obrigatória");

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    next();
};

/**
 * Middleware for validating password reset request
 */
exports.validatePasswordReset = (req, res, next) => {
    const { token, newPassword } = req.body;
    const errors = [];

    if (!token) errors.push("Token é obrigatório");
    if (!newPassword) errors.push("Nova senha é obrigatória");

    if (newPassword && newPassword.length < 8) {
        errors.push("A nova senha deve ter pelo menos 8 caracteres");
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    next();
};

/**
 * Middleware for validating user status update
 */
exports.validateStatusUpdate = (req, res, next) => {
    const { userId, status } = req.body;
    const errors = [];

    if (!userId) errors.push("ID do usuário é obrigatório");
    if (!status) errors.push("Status é obrigatório");

    if (status) {
        const validStatuses = ["ACTIVE", "INACTIVE", "SUSPENDED"];
        if (!validStatuses.includes(status)) {
            errors.push("Status inválido");
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    next();
};

/**
 * Middleware for validating user update data
 */
exports.validateUserUpdate = (req, res, next) => {
    const { email } = req.body;
    const errors = [];

    // Validate email format if provided
    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errors.push("Formato de email inválido");
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    next();
};

/**
 * Middleware for validating password update
 */
exports.validatePasswordUpdate = (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    const errors = [];

    if (!currentPassword) errors.push("Senha atual é obrigatória");
    if (!newPassword) errors.push("Nova senha é obrigatória");

    if (newPassword) {
        if (newPassword.length < 8) {
            errors.push("A nova senha deve ter pelo menos 8 caracteres");
        }

        // Additional password strength checks could be added here
        // For example: requiring uppercase, lowercase, numbers, special chars
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    next();
};