const bcrypt = require("bcryptjs");
const User = require("../models/User");
const emailService = require("../services/emailService");
const { Op } = require("sequelize");
const crypto = require("crypto");
const speakeasy = require("speakeasy");

// Generate a secure random token
const generateCustomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Search for user by filter
exports.getUser = async (req, res) => {
  try {
    const { name, email, phone_number, user_type, status } = req.query;

    if (!name && !email && !phone_number && !user_type && !status) {
      return res.status(400).json({ error: "Pelo menos um parâmetro de busca é necessário" });
    }

    // Creating conditions dynamically with proper escaping for LIKE queries
    let whereCondition = {};
    if (name) whereCondition.name = { [Op.like]: `%${name.replace(/[%_]/g, '\\$&')}%` };
    if (email) whereCondition.email = { [Op.like]: `%${email.replace(/[%_]/g, '\\$&')}%` };
    if (phone_number) whereCondition.phone_number = { [Op.like]: `%${phone_number.replace(/[%_]/g, '\\$&')}%` };
    if (user_type) whereCondition.user_type = user_type;
    if (status) whereCondition.status = status;

    const users = await User.findAll({
      where: whereCondition,
      attributes: {
        exclude: [
          'password',
          'refresh_token',
          'refresh_token_expires',
          'reset_password_token',
          'reset_password_expires',
          'two_factor_secret'
        ]
      }
    });

    if (users.length === 0) {
      return res.status(404).json({ message: "Nenhum usuário encontrado" });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ error: "Falha ao buscar usuários" });
  }
};

// Password reset request
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email é obrigatório" });
    }

    // Check if the user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Generate custom token and set expiration
    const token = generateCustomToken();
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Expires in 1 hour

    await user.update({
      reset_password_token: token,
      reset_password_expires: expires,
    });

    // Send password reset token via email
    try {
      await emailService.sendEmail({
        to: user.email,
        subject: "Redefinição de Senha - Podevim",
        templateName: "resetPassword",
        context: {
          token,
          name: user.name,
          expiresIn: '1 hora'
        },
      });

      res.status(200).json({ message: "Token de redefinição de senha enviado para o email" });
    } catch (emailError) {
      console.error("Erro ao enviar email:", emailError);
      // Reset the token if email fails
      await user.update({
        reset_password_token: null,
        reset_password_expires: null,
      });
      res.status(500).json({ error: "Falha ao enviar email de redefinição de senha" });
    }
  } catch (error) {
    console.error("Erro ao processar redefinição de senha:", error);
    res.status(500).json({ error: "Falha ao solicitar redefinição de senha" });
  }
};

// Reset password with token
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token e nova senha são obrigatórios" });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "A senha deve ter pelo menos 8 caracteres" });
    }

    // Find user by token and check if token hasn't expired
    const user = await User.findOne({
      where: {
        reset_password_token: token,
        reset_password_expires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Token inválido ou expirado" });
    }

    // Update password with new encrypted password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({
      password: hashedPassword,
      reset_password_token: null,
      reset_password_expires: null,
    });

    res.status(200).json({ message: "Senha redefinida com sucesso" });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    res.status(500).json({ error: "Falha ao redefinir senha" });
  }
};

// Update user information
exports.updateUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone_number, profile_photo, preferences, device_token } = req.body;

    // Find user by ID
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Prepare data for update
    const updateData = {};
    if (name) updateData.name = name;

    // Check if email is being changed and not already in use
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: "Este email já está em uso" });
      }
      updateData.email = email;
    }

    if (phone_number) updateData.phone_number = phone_number;
    if (profile_photo) updateData.profile_photo = profile_photo;
    if (device_token) updateData.device_token = device_token;

    // If preferences are provided, merge with existing ones
    if (preferences) {
      const currentPrefs = user.preferences || {};
      updateData.preferences = { ...currentPrefs, ...preferences };
    }

    // Update the user
    await user.update(updateData);

    // Return user without sensitive fields
    const userResponse = user.toJSON();

    res.status(200).json({ message: "Usuário atualizado com sucesso", user: userResponse });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({ error: "Falha ao atualizar usuário" });
  }
};

// Update user status
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId, status } = req.body;

    if (!userId || !status) {
      return res.status(400).json({ error: "ID do usuário e status são obrigatórios" });
    }

    // Verify if status is valid
    const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Status inválido" });
    }

    // Find user by ID
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Check if user is trying to change their own status
    if (req.user.id === userId && status !== 'ACTIVE') {
      return res.status(403).json({ error: "Você não pode alterar seu próprio status" });
    }

    await user.update({ status });

    res.status(200).json({
      message: "Status do usuário atualizado com sucesso",
      userId,
      status
    });
  } catch (error) {
    console.error("Erro ao atualizar status do usuário:", error);
    res.status(500).json({ error: "Falha ao atualizar status do usuário" });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID do usuário é obrigatório" });
    }

    const user = await User.findByPk(id, {
      attributes: {
        exclude: [
          'password',
          'refresh_token',
          'refresh_token_expires',
          'reset_password_token',
          'reset_password_expires',
          'two_factor_secret'
        ]
      }
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({ error: "Falha ao buscar usuário" });
  }
};

// Set up two-factor authentication
exports.setupTwoFactor = async (req, res) => {
  try {
    const userId = req.user.id;

    // Generate a TOTP secret
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `App:${req.user.email}`,
    });

    // Update user with the token
    await User.update(
      {
        two_factor_secret: secret.base32,
        two_factor_enabled: false
      },
      { where: { id: userId } }
    );

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

// Verify two-factor token
exports.verifyTwoFactor = async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ error: "ID do usuário e código são obrigatórios" });
    }

    // Find user to verify token
    const user = await User.findByPk(userId);

    if (!user || !user.two_factor_secret) {
      return res.status(400).json({ error: "Configuração 2FA não encontrada" });
    }

    // Verify TOTP code
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (!verified) {
      return res.status(401).json({ error: "Código de verificação inválido" });
    }

    // If verifying for the first time, enable 2FA
    if (!user.two_factor_enabled) {
      await user.update({ two_factor_enabled: true });
    }

    res.status(200).json({ message: "Autenticação de dois fatores verificada com sucesso" });
  } catch (error) {
    console.error("Erro ao verificar 2FA:", error);
    res.status(500).json({ error: "Falha ao verificar autenticação de dois fatores" });
  }
};

// Update password
exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Senha atual e nova senha são obrigatórias" });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "A nova senha deve ter pelo menos 8 caracteres" });
    }

    // Find user by ID
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Check current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Senha atual incorreta" });
    }

    // Update with new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    res.status(200).json({ message: "Senha atualizada com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar senha:", error);
    res.status(500).json({ error: "Falha ao atualizar senha" });
  }
};