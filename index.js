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
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;
const isLocal = process.env.NODE_ENV !== "production";

// 🔒 Segurança básica com Helmet
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// 🌍 Configuração do CORS - Permitir todas origens em desenvolvimento
app.use(cors({ origin: true, credentials: true }));

// 📏 Middlewares básicos
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// 📑 Configuração do Swagger usando variáveis de ambiente para determinar o host
const currentHost = isLocal
  ? `http://localhost:${PORT}`
  : "https://api.podevim.com.br";

// Diretório para guardar a definição do Swagger
const swaggerDir = path.join(__dirname, 'swagger');
if (!fs.existsSync(swaggerDir)) {
  fs.mkdirSync(swaggerDir, { recursive: true });
}

// Definição do Swagger
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
      { url: currentHost, description: "Servidor Atual" }
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

// 📄 Geração da documentação Swagger
const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Salvar a definição do Swagger para ser usada diretamente
const swaggerOutputPath = path.join(swaggerDir, 'swagger.json');
fs.writeFileSync(swaggerOutputPath, JSON.stringify(swaggerDocs, null, 2));

// Opções avançadas para o Swagger UI
const swaggerUiOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    url: `${currentHost}/swagger.json`, // Forçar o uso da URL correta
    docExpansion: 'list',
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
  }
};

// Servir a definição do Swagger como um arquivo estático
app.get("/swagger.json", (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.sendFile(swaggerOutputPath);
});

// Configurar o Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(null, swaggerUiOptions));

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
    docs: `${currentHost}/api-docs`,
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

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🔥 Servidor rodando na porta ${PORT}`);
      console.log(`📄 Documentação Swagger disponível em: ${currentHost}/api-docs`);
    });
  } catch (err) {
    console.error("❌ Erro ao iniciar o servidor:", err);
    process.exit(1);
  }
};

// 🏁 Inicia o servidor
startServer();