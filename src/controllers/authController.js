const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");

// Função para gerar o token de acesso (JWT)
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "15m" }); // Expira em 15 minutos
};

// Função para gerar o refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString("hex");
};

// Login com geração de refresh token
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Senha incorreta" });
    }

    // Gere o token de acesso e o refresh token
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken();

    // Armazene o refresh token no banco de dados para o usuário
    await user.update({ refresh_token: refreshToken });

    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(200).json({
      message: "Login realizado com sucesso!",
      accessToken,
      refreshToken,
      user: userResponse,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Endpoint para atualizar o token de acesso usando o refresh token
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token não fornecido" });
  }

  try {
    const user = await User.findOne({ where: { refresh_token: refreshToken } });
    if (!user) {
      return res.status(403).json({ error: "Refresh token inválido" });
    }

    // Gere um novo token de acesso
    const newAccessToken = generateAccessToken(user.id);

    // (Opcional) Gere um novo refresh token para aumentar a segurança
    const newRefreshToken = generateRefreshToken();
    await user.update({ refresh_token: newRefreshToken });

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(500).json({ error: "Falha ao gerar novo token de acesso" });
  }
};
