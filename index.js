// 🌱 Carrega variáveis de ambiente conforme o NODE_ENV
const NODE_ENV = process.env.NODE_ENV || "development";
const envFile = NODE_ENV === "production" ? ".env.production" : ".env.development";
require("dotenv").config({ path: envFile });

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
app.set('trust proxy', 1); // ✅ Corrige problema do X-Forwarded-For

// 📦 Conexão com DB
const { connectToDatabase } = require("./src/config/database");

// 🔁 Rotas
const authRoutes = require("./src/routes/authRoutes");
const addressRoutes = require("./src/routes/addressRoutes");
const userRoutes = require("./src/routes/userRoutes");
const schoolRoutes = require("./src/routes/schoolRoutes");
const parkingRoutes = require("./src/routes/parkingRoutes");
const rootRoutes = require("./src/routes/rootRoutes");

const PORT = process.env.PORT || 5000;
const isLocal = NODE_ENV !== "production";
const BASE_URL = process.env.SWAGGER_SERVER_URL || `http://localhost:${PORT}`;

// 🔐 Segurança
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// 🌐 CORS
app.use(cors({ origin: true, credentials: true }));

// 🛡️ Limite de requisições
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Muitas requisições. Tente novamente mais tarde." },
}));

// 🧰 Middlewares
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// 📄 Swagger
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
        url: BASE_URL,
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
    docExpansion: "list",
    persistAuthorization: true,
    displayRequestDuration: true,
  },
}));

// 🔁 Rotas
app.use("/api/auth", authRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/user", userRoutes);
app.use("/api/school", schoolRoutes);
app.use("/api/parking", parkingRoutes);
app.use("/", rootRoutes);

// 🔎 Rota raiz
app.get("/", (req, res) => {
  res.json({
    status: "🔥 API Podevim está rodando!",
    version: "1.0.0",
    docs: `${BASE_URL}/api-docs`,
  });
});

// ❌ 404
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// 🚨 Tratamento de erros
app.use((err, req, res, next) => {
  console.error("🚨 Erro na aplicação:", err.stack);
  res.status(500).json({
    error: "Erro interno do servidor",
    message: isLocal ? err.message : "Algo deu errado, tente novamente mais tarde",
  });
});

// 🚀 Iniciar servidor
const startServer = async () => {
  try {
    await connectToDatabase();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🔥 Servidor rodando na porta ${PORT}`);
      console.log(`📄 Swagger: ${BASE_URL}/api-docs`);
    });
  } catch (err) {
    console.error("❌ Erro ao iniciar o servidor:", err);
    process.exit(1);
  }
};

startServer();
