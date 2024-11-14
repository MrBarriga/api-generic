require("dotenv").config();
const express = require("express");
const morgan = require("morgan"); // Certifique-se de que morgan foi importado
const sequelize = require("./src/config/database");
const authRoutes = require("./src/routes/authRoutes");
const addressRoutes = require("./src/routes/addressRoutes");
const userRoutes = require("./src/routes/userRoutes");

const app = express();

// Middlewares
app.use(express.json());
app.use(morgan("dev")); // "dev" é um formato de log útil para desenvolvimento

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/user", userRoutes);

// Porta do Servidor
const PORT = process.env.PORT || 5000;

// Conexão com o Banco de Dados e Inicialização do Servidor
sequelize.sync()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error("Unable to connect to the database:", err);
  });
