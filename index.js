require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const { sequelize, connectToDatabase } = require("./src/config/database");
const authRoutes = require("./src/routes/authRoutes");
const addressRoutes = require("./src/routes/addressRoutes");
const userRoutes = require("./src/routes/userRoutes");
const schoolRoutes = require("./src/routes/schoolRoutes");
const parkingRoutes = require("./src/routes/parkingRoutes");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

const app = express();
const PORT = process.env.PORT || 5000;
const isLocal = process.env.NODE_ENV !== "production";

// 🔒 Melhor segurança com configurações adicionais do Helmet
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// 🚦 Rate Limiting para proteção contra ataques DoS
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisições, tente novamente mais tarde" },
});
app.use("/api", apiLimiter);

// 🌍 Configuração do CORS para permitir requisições externas
app.use(
  cors({
    origin: isLocal
      ? ["http://localhost:5000", "http://localhost:3000", "http://127.0.0.1:5000", "http://127.0.0.1:3000"]
      : ["https://api.podevim.com.br", "https://www.podevim.com.br"],
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true
  })
);

// 📏 Middlewares básicos
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// 📑 Configuração dinâmica do Swagger
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Podevim API",
      version: "1.0.0",
      description: "API do sistema Podevim para gerenciamento escolar e estacionamentos",
      contact: { name: "Suporte Podevim", email: "suporte@podevim.com.br" },
    },
    servers: isLocal
      ? [{ url: "http://localhost:5000", description: "Servidor Local" }]
      : [{ url: "https://api.podevim.com.br", description: "Servidor Produção" }],
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

// 📄 Geração e configuração do Swagger
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// 📝 Middleware de Logging de requisições
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// 🔗 Registro das Rotas da API
app.use("/api/auth", authRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/user", userRoutes);
app.use("/api/school", schoolRoutes);
app.use("/api/parking", parkingRoutes);

// 🏠 Teste de rota raiz
app.get("/", (req, res) => {
  res.json({
    status: "🔥 API Podevim está rodando!",
    version: "1.0.0",
    docs: `${isLocal ? "http://localhost:5000" : "https://api.podevim.com.br"}/api-docs`,
  });
});

// ❌ Middleware para tratamento de erros
app.use((err, req, res, next) => {
  console.error("🚨 Erro na aplicação:", err.stack);
  res.status(500).json({
    error: "Erro interno do servidor",
    message: isLocal ? err.message : "Algo deu errado, tente novamente mais tarde",
  });
});

// 🛑 Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// 🚀 Função para iniciar o servidor e conectar ao banco de dados
const startServer = async () => {
  try {
    await connectToDatabase(); // 🔌 Conectar ao banco
    app.listen(PORT, () => {
      console.log(`🔥 Servidor rodando na porta ${PORT}`);
      console.log(`📄 Documentação Swagger disponível em ${isLocal ? "http://localhost:5000" : "https://api.podevim.com.br"}/api-docs`);
    });
  } catch (err) {
    console.error("❌ Erro ao iniciar o servidor:", err);
    process.exit(1);
  }
};

// 🏁 Inicia o servidor
startServer();