const User = require("../models/User");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

/**
 * Função para gerar um access token
 */
function generateAccessToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "15m" }); // Access token expira em 15 minutos
}

/**
 * Função para gerar um refresh token
 */
function generateRefreshToken() {
  return crypto.randomBytes(40).toString("hex");
}

/**
 * Função para criar um novo usuário com o ID gerado a partir do nome da empresa
 */
async function createUser(data) {
  const { name, last_name, email, password, empresa, phone_number, pro_number } = data;

  // Extrai as iniciais da empresa para usar no ID
  const empresaPrefix = empresa.toUpperCase().substring(0, 4); // Pega as primeiras 4 letras, ex: ITAU

  // Busca o último ID gerado para essa empresa
  const lastUser = await User.findOne({
    where: {
      id: { [Op.like]: `${empresaPrefix}%` }
    },
    order: [["id", "DESC"]]
  });

  // Calcula o próximo valor da sequência
  let nextSeq = 1;
  if (lastUser) {
    const lastSeq = parseInt(lastUser.id.slice(empresaPrefix.length));
    nextSeq = lastSeq + 1;
  }

  // Gera o ID no formato desejado
  const userId = `${empresaPrefix}${nextSeq}`;

  // Cria o hash da senha antes de salvar o usuário
  const hashedPassword = await bcrypt.hash(password, 10);

  // Cria o usuário com o ID gerado e a senha criptografada
  const newUser = await User.create({
    id: userId,
    name,
    last_name,
    email,
    password: hashedPassword,
    phone_number,
    pro_number,
    empresa
  });

  const userResponse = newUser.toJSON();
  delete userResponse.password;

  return userResponse;
}

/**
 * Função para autenticar o usuário com email e senha e gerar tokens de acesso e refresh
 */
async function login(req, res) {
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
}

/**
 * Função para atualizar o access token usando o refresh token
 */
async function refreshToken(req, res) {
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
}

module.exports = { createUser, login, refreshToken };
