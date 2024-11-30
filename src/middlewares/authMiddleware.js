const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.header("Authorization");

  // Verificar se o cabeçalho Authorization existe e se começa com "Bearer "
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1]; // Extrair o token do cabeçalho

  try {
    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Armazenar os dados do usuário decodificado no objeto req
    req.user = decoded;

    // Logs para debug
    console.log("Authorization Header:", authHeader);
    console.log("Token Decoded:", decoded);
    console.log("User ID:", req.user.id);

    next(); // Continuar para o próximo middleware ou rota
  } catch (error) {
    console.error("Token verification failed:", error.message);
    res.status(401).json({ error: "Invalid token" });
  }
};
