require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Conexão com DB
const { connectToDatabase } = require("./src/config/database");

// Rotas
const authRoutes = require("./src/routes/authRoutes");
const addressRoutes = require("./src/routes/addressRoutes");
const userRoutes = require("./src/routes/userRoutes");
const schoolRoutes = require("./src/routes/schoolRoutes");
const parkingRoutes = require("./src/routes/parkingRoutes");
const rootRoutes = require("./src/routes/rootRoutes");

const app = express();

// 🌍 Configurações
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";
const isLocal = NODE_ENV !== "production";

// 🔐 Segurança
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// 🌐 CORS liberado no dev
app.use(cors({ origin: true, credentials: true }));

// 🛡️ Limite de requisições
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Muitas requisições. Tente novamente mais tarde." },
  })
);

// 🧰 Middlewares
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// 📄 Swagger Setup
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Podevim API",
      version: "1.0.0",
      description: "API do sistema Podevim para gerenciamento escolar e estacionamentos",
      contact: { name: "Suporte Podevim", email: "suporte@podevim.com.br" },
    },
    servers: [
      {
        url: isLocal ? `http://localhost:${PORT}` : "https://api.podevim.com.br",
        description: isLocal ? "Servidor Local" : "Servidor Produção",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerJsDoc(swaggerOptions), {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    docExpansion: 'list',
    persistAuthorization: true,
    displayRequestDuration: true,
  },
}));

// 🚦 Rotas
app.use("/api/auth", authRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/user", userRoutes);
app.use("/api/school", schoolRoutes);
app.use("/api/parking", parkingRoutes);
app.use("/", rootRoutes);

// ✅ Teste de rota raiz
app.get("/", (req, res) => {
  const baseUrl = isLocal ? `http://localhost:${PORT}` : "https://api.podevim.com.br";
  res.json({
    status: "🔥 API Podevim está rodando!",
    version: "1.0.0",
    docs: `${baseUrl}/api-docs`,
  });
});

// ❌ Rota não encontrada
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// 🧯 Tratamento de erros
app.use((err, req, res, next) => {
  console.error("🚨 Erro na aplicação:", err.stack);
  res.status(500).json({
    error: "Erro interno do servidor",
    message: isLocal ? err.message : "Algo deu errado, tente novamente mais tarde",
  });
});

// 🚀 Inicia o servidor
const startServer = async () => {
  try {
    await connectToDatabase();

    app.listen(PORT, "0.0.0.0", () => {
      const baseUrl = isLocal ? `http://localhost:${PORT}` : "https://api.podevim.com.br";
      console.log(`🔥 Servidor rodando na porta ${PORT}`);
      console.log(`📄 Swagger: ${baseUrl}/api-docs`);
    });
  } catch (err) {
    console.error("❌ Erro ao iniciar o servidor:", err);
    process.exit(1);
  }
};

startServer();
