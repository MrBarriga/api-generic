const bcrypt = require("bcryptjs");
const User = require("../models/User");
const emailService = require("../services/emailService");
const { Op } = require("sequelize");
const { generateCustomToken } = require("../utils/tokenUtils");

// Busca por usuário por filtro
exports.getUser = async (req, res) => {
  try {
    const { name, last_name, email, phone_number } = req.query;

    if (!name && !last_name && !email && !phone_number) {
      return res.status(400).json({ error: "At least one search parameter is required" });
    }

    // Criando um objeto de condições dinamicamente
    let whereCondition = {};
    if (name) whereCondition.name = { [Op.like]: `%${name}%` };
    if (last_name) whereCondition.last_name = { [Op.like]: `%${last_name}%` };
    if (email) whereCondition.email = { [Op.like]: `%${email}%` };
    if (phone_number) whereCondition.phone_number = { [Op.like]: `%${phone_number}%` };

    const users = await User.findAll({ where: whereCondition });

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Failed to search users" });
  }
};

// Solicitação de redefinição de senha
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Verificar se o usuário existe
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Gerar token personalizado e definir expiração
    const token = generateCustomToken();
    const expires = Date.now() + 3600000; // Expira em 1 hora

    await user.update({
      reset_password_token: token,
      reset_password_expires: expires,
    });

    // Enviar o token de redefinição de senha via e-mail
    await emailService.sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      templateName: "resetPassword",
      context: { token },
    });

    res.status(200).json({ message: "Password reset token sent to email" });
  } catch (error) {
    console.error("Error sending password reset email:", error);
    res.status(500).json({ error: "Failed to request password reset" });
  }
};

// Resetar a senha com o token
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Buscar usuário pelo token e verificar se o token não expirou
    const user = await User.findOne({
      where: {
        reset_password_token: token,
        reset_password_expires: { [Op.gt]: Date.now() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Atualizar a senha com a nova senha criptografada
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({
      password: hashedPassword,
      reset_password_token: null,
      reset_password_expires: null,
    });

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
};

// Atualizar informações do usuário
exports.updateUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, last_name, phone_number, pro_number, email, photo } = req.body;

    // Buscar usuário pelo ID
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Atualizar apenas os campos fornecidos
    await user.update({
      name: name || user.name,
      last_name: last_name || user.last_name,
      phone_number: phone_number || user.phone_number,
      pro_number: pro_number || user.pro_number,
      email: email || user.email,
      photo: photo || user.photo,
    });

    res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
};
