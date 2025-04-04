require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const sequelize = require("./src/config/database");
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

// Detecta se está rodando localmente ou em produção
const isLocal = process.env.NODE_ENV !== "production";

// Melhora a segurança da aplicação
app.use(helmet());

// Configuração de rate limiting para prevenir abusos na API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisições, tente novamente mais tarde" }
});

// Aplicar rate limiting em todas as rotas da API
app.use("/api", apiLimiter);

// Middleware CORS para permitir requisições externas
app.use(cors({
  origin: ["https://api.podevim.com.br", "https://www.podevim.com.br", "http://localhost:5000"],
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization"
}));

// Middlewares básicos
app.use(express.json({ limit: '1mb' })); // Limita o tamanho das requisições
app.use(morgan("dev"));

// Configuração dinâmica de servidores para Swagger
const servers = [];

if (isLocal) {
  servers.push({
    url: "http://localhost:5000",
    description: "Servidor Local"
  });
} else {
  servers.push({
    url: "https://api.podevim.com.br",
    description: "Servidor Produção"
  });
}

// Configuração do Swagger
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Podevim API",
      version: "1.0.0",
      description: "API do sistema Podevim para gerenciamento escolar e estacionamentos",
      contact: {
        name: "Suporte Podevim",
        email: "suporte@podevim.com.br"
      }
    },
    servers, // Usa a lista dinâmica de servidores
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
  // Inclui todos os arquivos de rotas para documentação
  apis: ["./src/routes/*.js"],
};

// Geração da documentação Swagger
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middleware para logging das requisições
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Registra as rotas da API
app.use("/api/auth", authRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/user", userRoutes);
app.use("/api/school", schoolRoutes);
app.use("/api/parking", parkingRoutes);

// Teste de rota raiz
app.get("/", (req, res) => {
  res.json({
    status: "🔥 API Podevim está rodando!",
    version: "1.0.0",
    docs: `${isLocal ? "http://localhost:5000" : "https://api.podevim.com.br"}/api-docs`
  });
});

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro na aplicação:', err.stack);
  res.status(500).json({
    error: "Erro interno do servidor",
    message: isLocal ? err.message : "Algo deu errado, tente novamente mais tarde"
  });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// Definição da porta e inicialização do servidor
const PORT = process.env.PORT || 5000;

// Função para sincronizar o banco de dados e iniciar o servidor
const startServer = async () => {
  try {
    // Conectar ao banco de dados
    await sequelize.authenticate();
    console.log("✅ Banco de dados conectado!");

    // Sincronizar modelos com o banco de dados (em produção use {force: false})
    await sequelize.sync({ alter: isLocal });
    console.log("✅ Modelos sincronizados com o banco de dados");

    // Iniciar o servidor
    app.listen(PORT, () => {
      console.log(`🔥 Servidor rodando na porta ${PORT}`);
      console.log(`📄 Documentação Swagger disponível em ${isLocal ? "http://localhost:5000" : "https://api.podevim.com.br"}/api-docs`);
    });
  } catch (err) {
    console.error("❌ Erro ao iniciar o servidor:", err);
    process.exit(1);
  }
};

// Inicia o servidor
startServer();