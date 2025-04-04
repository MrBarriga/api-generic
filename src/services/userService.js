const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const speakeasy = require("speakeasy");

/**
 * Function to generate an access token
 */
function generateAccessToken(userId) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        console.warn("WARNING: JWT_SECRET is not properly set or too weak");
    }
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "15m" }); // Access token expires in 15 minutes
}

/**
 * Function to generate a refresh token
 */
function generateRefreshToken() {
    return crypto.randomBytes(40).toString("hex");
}

/**
 * Function to create a new user
 */
async function createUser(data) {
    const {
        name,
        email,
        password,
        phone_number,
        user_type = "PARENT", // Default type is parent
        status = "ACTIVE",
        preferences = {},
    } = data;

    // Validate required fields
    if (!name || !email || !password) {
        throw new Error("Nome, email e senha são obrigatórios");
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        throw new Error("Um usuário com este email já existe");
    }

    // Validate password strength
    if (password.length < 8) {
        throw new Error("A senha deve ter pelo menos 8 caracteres");
    }

    // Validate user type
    const validTypes = ["ADMIN", "SCHOOL", "PARENT", "STUDENT", "PARKING_PROVIDER"];
    if (!validTypes.includes(user_type)) {
        throw new Error("Tipo de usuário inválido");
    }

    // Create hash of password before saving the user
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with automatically generated UUID and encrypted password
    const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        phone_number,
        user_type,
        status,
        preferences,
        created_at: new Date(),
    });

    const userResponse = newUser.toJSON();
    delete userResponse.password;
    delete userResponse.refresh_token;
    delete userResponse.reset_password_token;
    delete userResponse.two_factor_secret;

    return userResponse;
}

/**
 * Function to authenticate user with email and password and generate access and refresh tokens
 */
async function login(req, res) {
    const { email, password } = req.body;

    try {
        // Input validation
        if (!email || !password) {
            return res.status(400).json({ error: "Email e senha são obrigatórios" });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        if (user.status === "SUSPENDED") {
            return res.status(403).json({ error: "Conta suspensa. Entre em contato com o suporte." });
        }

        if (user.status === "INACTIVE") {
            return res.status(403).json({ error: "Conta inativa. Por favor, ative sua conta." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Credenciais inválidas" });
        }

        // Generate access token and refresh token
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken();
        const refreshExpires = new Date();
        refreshExpires.setDate(refreshExpires.getDate() + 30); // Expires in 30 days

        // Store refresh token in database for the user
        await user.update({
            refresh_token: refreshToken,
            refresh_token_expires: refreshExpires,
            last_access: new Date(),
        });

        const userResponse = user.toJSON();
        delete userResponse.password;
        delete userResponse.refresh_token;
        delete userResponse.reset_password_token;
        delete userResponse.two_factor_secret;

        // Check if 2FA is enabled
        const requires2FA = !!user.two_factor_enabled;

        res.status(200).json({
            message: "Login realizado com sucesso!",
            accessToken,
            refreshToken,
            requires2FA,
            user: userResponse,
        });
    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ error: "Falha ao realizar login. Tente novamente." });
    }
}

/**
 * Function to update access token using refresh token
 */
async function refreshToken(req, res) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token não fornecido" });
    }

    try {
        const user = await User.findOne({
            where: {
                refresh_token: refreshToken,
                refresh_token_expires: { [Op.gt]: new Date() },
            },
        });

        if (!user) {
            return res.status(403).json({ error: "Refresh token inválido ou expirado" });
        }

        // Generate a new access token
        const newAccessToken = generateAccessToken(user.id);

        // Generate a new refresh token for increased security
        const newRefreshToken = generateRefreshToken();
        const refreshExpires = new Date();
        refreshExpires.setDate(refreshExpires.getDate() + 30); // Expires in 30 days

        await user.update({
            refresh_token: newRefreshToken,
            refresh_token_expires: refreshExpires,
            last_access: new Date(),
        });

        res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (error) {
        console.error("Erro ao renovar token:", error);
        res.status(500).json({ error: "Falha ao gerar novo token de acesso" });
    }
}

/**
 * Function to get user by ID
 */
async function getUserById(userId) {
    if (!userId) {
        throw new Error("ID do usuário é obrigatório");
    }

    const user = await User.findByPk(userId, {
        attributes: {
            exclude: [
                "password",
                "refresh_token",
                "refresh_token_expires",
                "reset_password_token",
                "reset_password_expires",
                "two_factor_secret",
            ],
        },
    });

    if (!user) {
        throw new Error("Usuário não encontrado");
    }

    return user;
}

/**
 * Function to find users by filters
 */
async function findUsers(filters) {
    const { name, email, phone_number, user_type, status } = filters;

    if (!name && !email && !phone_number && !user_type && !status) {
        throw new Error("Pelo menos um parâmetro de busca é necessário");
    }

    // Create conditions object dynamically with proper escaping for LIKE queries
    let whereCondition = {};
    if (name) whereCondition.name = { [Op.like]: `%${name.replace(/[%_]/g, "\\$&")}%` };
    if (email) whereCondition.email = { [Op.like]: `%${email.replace(/[%_]/g, "\\$&")}%` };
    if (phone_number) whereCondition.phone_number = { [Op.like]: `%${phone_number.replace(/[%_]/g, "\\$&")}%` };
    if (user_type) whereCondition.user_type = user_type;
    if (status) whereCondition.status = status;

    const users = await User.findAll({
        where: whereCondition,
        attributes: {
            exclude: [
                "password",
                "refresh_token",
                "refresh_token_expires",
                "reset_password_token",
                "reset_password_expires",
                "two_factor_secret",
            ],
        },
    });

    return users;
}

/**
 * Function to update user data
 */
async function updateUserData(userId, userData) {
    if (!userId) {
        throw new Error("ID do usuário é obrigatório");
    }

    const user = await User.findByPk(userId);

    if (!user) {
        throw new Error("Usuário não encontrado");
    }

    // Prepare data for update
    const updateData = {};

    // Fields that can be updated
    const allowedFields = ["name", "email", "phone_number", "profile_photo", "device_token", "status"];

    // Update only provided fields
    allowedFields.forEach((field) => {
        if (userData[field] !== undefined) {
            updateData[field] = userData[field];
        }
    });

    // Special handling for email (check if it's already in use)
    if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findOne({ where: { email: updateData.email } });
        if (existingUser) {
            throw new Error("Este email já está em uso");
        }
    }

    // Special handling for preferences (merging)
    if (userData.preferences) {
        const currentPrefs = user.preferences || {};
        updateData.preferences = { ...currentPrefs, ...userData.preferences };
    }

    // If there's a new password, hash it
    if (userData.password) {
        // Validate password strength
        if (userData.password.length < 8) {
            throw new Error("A senha deve ter pelo menos 8 caracteres");
        }
        updateData.password = await bcrypt.hash(userData.password, 10);
    }

    await user.update(updateData);

    // Return updated user without sensitive fields
    const updatedUser = await User.findByPk(userId, {
        attributes: {
            exclude: [
                "password",
                "refresh_token",
                "refresh_token_expires",
                "reset_password_token",
                "reset_password_expires",
                "two_factor_secret",
            ],
        },
    });

    return updatedUser;
}

/**
 * Function to change user status
 */
async function changeUserStatus(userId, newStatus) {
    if (!userId || !newStatus) {
        throw new Error("ID do usuário e status são obrigatórios");
    }

    const validStatuses = ["ACTIVE", "INACTIVE", "SUSPENDED"];

    if (!validStatuses.includes(newStatus)) {
        throw new Error("Status inválido");
    }

    const user = await User.findByPk(userId);

    if (!user) {
        throw new Error("Usuário não encontrado");
    }

    await user.update({ status: newStatus });

    return {
        userId,
        status: newStatus,
        message: "Status atualizado com sucesso",
    };
}

/**
 * Function to generate password reset token
 */
async function generatePasswordResetToken(email) {
    if (!email) {
        throw new Error("Email é obrigatório");
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
        throw new Error("Usuário não encontrado");
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Expires in 1 hour

    await user.update({
        reset_password_token: token,
        reset_password_expires: expires,
    });

    return {
        token,
        expires,
        email: user.email,
        name: user.name,
    };
}

/**
 * Function to reset password using a token
 */
async function resetPasswordWithToken(token, newPassword) {
    if (!token || !newPassword) {
        throw new Error("Token e nova senha são obrigatórios");
    }

    // Validate password strength
    if (newPassword.length < 8) {
        throw new Error("A senha deve ter pelo menos 8 caracteres");
    }

    const user = await User.findOne({
        where: {
            reset_password_token: token,
            reset_password_expires: { [Op.gt]: new Date() },
        },
    });

    if (!user) {
        throw new Error("Token inválido ou expirado");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await user.update({
        password: hashedPassword,
        reset_password_token: null,
        reset_password_expires: null,
    });

    return { message: "Senha redefinida com sucesso" };
}

/**
 * Function to set up two-factor authentication
 */
async function setupTwoFactorAuth(userId) {
    if (!userId) {
        throw new Error("ID do usuário é obrigatório");
    }

    const user = await User.findByPk(userId);

    if (!user) {
        throw new Error("Usuário não encontrado");
    }

    // Generate a TOTP secret
    const secret = speakeasy.generateSecret({
        length: 20,
        name: `App:${user.email}`,
    });

    await user.update({
        two_factor_secret: secret.base32,
        two_factor_enabled: false // Not enabled until verified
    });

    return {
        secret: secret.base32,
        otpAuthUrl: secret.otpauth_url,
        message: "Configuração de autenticação de dois fatores iniciada"
    };
}

/**
 * Function to verify two-factor token
 */
async function verifyTwoFactorToken(userId, code) {
    if (!userId || !code) {
        throw new Error("ID do usuário e código são obrigatórios");
    }

    const user = await User.findByPk(userId);

    if (!user || !user.two_factor_secret) {
        throw new Error("Configuração de 2FA não encontrada");
    }

    // Verify the code with speakeasy
    const verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token: code,
        window: 1 // Allow 1 period before and after for clock drift
    });

    if (!verified) {
        throw new Error("Código de verificação inválido");
    }

    // If verifying for the first time, enable 2FA
    if (!user.two_factor_enabled) {
        await user.update({ two_factor_enabled: true });
    }

    return { verified: true, message: "Código verificado com sucesso" };
}

/**
 * Function to disable two-factor authentication
 */
async function disableTwoFactorAuth(userId) {
    if (!userId) {
        throw new Error("ID do usuário é obrigatório");
    }

    const user = await User.findByPk(userId);

    if (!user) {
        throw new Error("Usuário não encontrado");
    }

    await user.update({
        two_factor_secret: null,
        two_factor_enabled: false
    });

    return { message: "Autenticação de dois fatores desativada com sucesso" };
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    createUser,
    login,
    refreshToken,
    getUserById,
    findUsers,
    updateUserData,
    changeUserStatus,
    generatePasswordResetToken,
    resetPasswordWithToken,
    setupTwoFactorAuth,
    verifyTwoFactorToken,
    disableTwoFactorAuth
};