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

// 🚧 Middleware para forçar HTTPS em produção
if (!isLocal) {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      const httpsUrl = `https://${req.header('host')}${req.url}`;
      return res.redirect(301, httpsUrl);
    }
    next();
  });
}

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
    origin: function (origin, callback) {
      // Lista de origens permitidas
      const allowedOrigins = isLocal
        ? [
          // Origens locais
          "http://localhost:5000",
          "http://localhost:3000",
          "http://127.0.0.1:5000",
          "http://127.0.0.1:3000",
          // IP específico
          "http://212.85.1.22:3000"
        ]
        : [
          // Origens de produção apenas com HTTPS
          "https://api.podevim.com.br",
          "https://www.podevim.com.br"
        ];

      // Permitir solicitações sem origem (como apps móveis ou curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log("Origem CORS bloqueada:", origin);
        // Em produção, bloqueamos origens não permitidas
        // Em desenvolvimento, permitimos para facilitar testes
        callback(isLocal ? null : new Error('Origem não permitida pelo CORS'), isLocal);
      }
    },
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization,X-Requested-With",
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
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
      ? [
        { url: "http://localhost:5000", description: "Servidor Local (localhost)" },
        { url: "http://212.85.1.22:3000", description: "Servidor Local (IP)" }
      ]
      : [
        { url: "https://api.podevim.com.br", description: "Servidor Produção" }
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

// 📄 Geração e configuração do Swagger
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }', // Remove a barra superior
  swaggerOptions: {
    docExpansion: 'list',
    persistAuthorization: true,
  }
}));

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

    // Obter o IP da máquina para exibir nos logs
    const getNetworkIP = () => {
      const interfaces = require('os').networkInterfaces();
      for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
          const alias = iface[i];
          if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
            return alias.address;
          }
        }
      }
      return '0.0.0.0';
    };

    const HOST = process.env.HOST || getNetworkIP();

    app.listen(PORT, '0.0.0.0', () => { // Escutar em todas as interfaces
      console.log(`🔥 Servidor rodando na porta ${PORT}`);
      console.log(`📄 Documentação Swagger disponível em:`);
      if (isLocal) {
        console.log(`   - Local: http://localhost:${PORT}/api-docs`);
        console.log(`   - Rede: http://${HOST}:${PORT}/api-docs`);
      } else {
        console.log(`   - Produção: https://api.podevim.com.br/api-docs`);
      }
    });
  } catch (err) {
    console.error("❌ Erro ao iniciar o servidor:", err);
    process.exit(1);
  }
};

// 🏁 Inicia o servidor
startServer();