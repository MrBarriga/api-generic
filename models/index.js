require("dotenv").config();
const fs = require("fs");
const http = require("http");
const https = require("https");
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const { sequelize, connectToDatabase } = require("./src/config/database");
const authRoutes = require("./src/routes/authRoutes");
const addressRoutes = require("./src/routes/addressRoutes");
const userRoutes = require("./src/routes/userRoutes");
const schoolRoutes = require("./src/routes/schoolRoutes");
const parkingRoutes = require("./src/routes/parkingRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const isLocal = process.env.NODE_ENV !== "production";

// 🔒 Segurança extra com Helmet
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// 🚦 Proteção contra ataques DoS (Rate Limiting)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisições, tente novamente mais tarde" },
});
app.use("/api", apiLimiter);

// 🌍 Configuração dinâmica do CORS
app.use(
  cors({
    origin: isLocal
      ? ["http://localhost:5000", "http://localhost:3000"]
      : ["https://api.podevim.com.br", "https://www.podevim.com.br"],
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true,
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
    servers: [
      { url: "http://localhost:5000", description: "Servidor Local (HTTP)" },
      { url: "https://api.podevim.com.br", description: "Servidor Produção (HTTPS)" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

// 📄 Geração e configuração do Swagger
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// 🔗 Registro das Rotas da API
app.use("/api/auth", authRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/user", userRoutes);
app.use("/api/school", schoolRoutes);
app.use("/api/parking", parkingRoutes);

// 🔄 Redireciona HTTP para HTTPS (Apenas em produção)
app.use((req, res, next) => {
  if (!isLocal && req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// 🏠 Rota raiz de teste
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

// 🔐 Configuração para rodar HTTP e HTTPS localmente
const startServer = async () => {
  try {
    await connectToDatabase(); // 🔌 Conectar ao banco

    // 🔑 Configuração de HTTPS (se houver certificados locais)
    let server;
    if (fs.existsSync("./certs/cert.pem") && fs.existsSync("./certs/key.pem")) {
      const options = {
        key: fs.readFileSync("./certs/key.pem"),
        cert: fs.readFileSync("./certs/cert.pem"),
      };
      server = https.createServer(options, app);
      console.log("✅ HTTPS ativado!");
    } else {
      server = http.createServer(app);
      console.log("⚠️ HTTPS não configurado, rodando apenas em HTTP!");
    }

    server.listen(PORT, () => {
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
