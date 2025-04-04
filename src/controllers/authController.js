const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { Op } = require("sequelize");
const speakeasy = require("speakeasy");

// Function to generate access token (JWT)
const generateAccessToken = (userId) => {
  // Verificação mais rigorosa do JWT_SECRET
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET não está definido nas variáveis de ambiente");
  }

  if (process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET é muito fraco. Use pelo menos 32 caracteres");
  }

  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

// Function to generate refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString("hex");
};

// Login with refresh token generation
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha são obrigatórios" });
  }

  try {
    const user = await User.findOne({ where: { email } });
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

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    try {
      // Generate access token and refresh token
      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken();

      // Set refresh token expiration (30 days)
      const refreshExpires = new Date();
      refreshExpires.setDate(refreshExpires.getDate() + 30);

      // Store the refresh token and update last access
      await user.update({
        refresh_token: refreshToken,
        refresh_token_expires: refreshExpires,
        last_access: new Date(),
      });

      const userResponse = user.toJSON();
      // Check if 2FA is enabled
      const requires2FA = !!user.two_factor_enabled;

      res.status(200).json({
        message: "Login realizado com sucesso!",
        accessToken,
        refreshToken,
        requires2FA,
        user: userResponse,
      });
    } catch (tokenError) {
      // Tratamento específico para erros de geração de token
      console.error("Erro na geração do token:", tokenError);
      return res.status(500).json({
        error: "Erro de configuração do servidor. Contate o administrador do sistema."
      });
    }
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: "Falha ao realizar login. Tente novamente." });
  }
};

// Endpoint to refresh access token using refresh token
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token não fornecido" });
  }

  try {
    // Find user by refresh token and check expiration
    const user = await User.findOne({
      where: {
        refresh_token: refreshToken,
        refresh_token_expires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(403).json({ error: "Refresh token inválido ou expirado" });
    }

    try {
      // Generate a new access token
      const newAccessToken = generateAccessToken(user.id);

      // Generate new refresh token for increased security
      const newRefreshToken = generateRefreshToken();

      // Set new expiration date
      const refreshExpires = new Date();
      refreshExpires.setDate(refreshExpires.getDate() + 30);

      // Update database
      await user.update({
        refresh_token: newRefreshToken,
        refresh_token_expires: refreshExpires,
        last_access: new Date(),
      });

      res.status(200).json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (tokenError) {
      console.error("Erro na geração do token:", tokenError);
      return res.status(500).json({
        error: "Erro de configuração do servidor. Contate o administrador do sistema."
      });
    }
  } catch (error) {
    console.error("Erro ao renovar token:", error);
    res.status(500).json({ error: "Falha ao gerar novo token de acesso" });
  }
};

// Function to check user status
exports.checkUserStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    if (user.status === "SUSPENDED") {
      return res.status(403).json({ error: "Conta suspensa. Entre em contato com o suporte." });
    }

    if (user.status === "INACTIVE") {
      return res.status(403).json({ error: "Conta inativa. Por favor, ative sua conta." });
    }

    // If we get here, the user is active
    next();
  } catch (error) {
    console.error("Erro ao verificar status do usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// 2FA verification (if configured)
exports.verifyTwoFactor = async (req, res) => {
  try {
    const { userId, code } = req.body;

    // Validate input
    if (!userId || !code) {
      return res.status(400).json({ error: "ID do usuário e código são obrigatórios" });
    }

    const user = await User.findByPk(userId);

    // If user doesn't have 2FA configured
    if (!user || !user.two_factor_secret) {
      return res.status(400).json({ error: "Configuração 2FA não encontrada" });
    }

    // Verify the 2FA code using speakeasy
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 1 // Allow 1 period before and after for clock drift
    });

    if (!verified) {
      return res.status(401).json({ error: "Código de verificação inválido" });
    }

    try {
      // Generate access and refresh tokens after successful 2FA verification
      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken();

      // Set refresh token expiration
      const refreshExpires = new Date();
      refreshExpires.setDate(refreshExpires.getDate() + 30);

      // Update the user record
      await user.update({
        refresh_token: refreshToken,
        refresh_token_expires: refreshExpires,
        last_access: new Date()
      });

      const userResponse = user.toJSON();

      res.status(200).json({
        message: "Autenticação de dois fatores verificada com sucesso",
        accessToken,
        refreshToken,
        user: userResponse
      });
    } catch (tokenError) {
      console.error("Erro na geração do token:", tokenError);
      return res.status(500).json({
        error: "Erro de configuração do servidor. Contate o administrador do sistema."
      });
    }
  } catch (error) {
    console.error("Erro na verificação 2FA:", error);
    res.status(500).json({ error: "Falha na verificação de autenticação de dois fatores" });
  }
};

// Function to set up two-factor authentication
exports.setupTwoFactor = async (req, res) => {
  try {
    const userId = req.user.id;

    // Generate a TOTP secret
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `App:${req.user.email}`,
    });

    // Find user
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Update the user with the secret
    await user.update({
      two_factor_secret: secret.base32,
      two_factor_enabled: false // Mark as not enabled until verified 
    });

    // Return the secret and QR code info to display to the user
    res.status(200).json({
      message: "Configuração de autenticação de dois fatores iniciada",
      secret: secret.base32,
      otpAuthUrl: secret.otpauth_url
    });
  } catch (error) {
    console.error("Erro ao configurar 2FA:", error);
    res.status(500).json({ error: "Falha ao configurar autenticação de dois fatores" });
  }
};

// Function to enable 2FA after verification
exports.enableTwoFactor = async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Código de verificação é obrigatório" });
    }

    const user = await User.findByPk(userId);

    if (!user || !user.two_factor_secret) {
      return res.status(404).json({ error: "Configuração 2FA não encontrada" });
    }

    // Verify the provided code
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (!verified) {
      return res.status(401).json({ error: "Código de verificação inválido" });
    }

    // Enable 2FA
    await user.update({ two_factor_enabled: true });

    res.status(200).json({
      message: "Autenticação de dois fatores ativada com sucesso"
    });
  } catch (error) {
    console.error("Erro ao ativar 2FA:", error);
    res.status(500).json({ error: "Falha ao ativar autenticação de dois fatores" });
  }
};

// Function to disable 2FA
exports.disableTwoFactor = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    await user.update({
      two_factor_secret: null,
      two_factor_enabled: false
    });

    res.status(200).json({
      message: "Autenticação de dois fatores desativada com sucesso"
    });
  } catch (error) {
    console.error("Erro ao desativar 2FA:", error);
    res.status(500).json({ error: "Falha ao desativar autenticação de dois fatores" });
  }
};

// Function to logout
exports.logout = async (req, res) => {
  try {
    const userId = req.user.id;

    await User.update(
      {
        refresh_token: null,
        refresh_token_expires: null
      },
      { where: { id: userId } }
    );

    res.status(200).json({ message: "Logout realizado com sucesso" });
  } catch (error) {
    console.error("Erro ao realizar logout:", error);
    res.status(500).json({ error: "Falha ao realizar logout" });
  }
};