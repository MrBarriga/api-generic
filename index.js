require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const sequelize = require("./src/config/database"); // Banco de dados
const authRoutes = require("./src/routes/authRoutes");
const addressRoutes = require("./src/routes/addressRoutes");
const userRoutes = require("./src/routes/userRoutes");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();

// Middleware CORS para permitir requisições externas
app.use(cors({
  origin: ["https://api.podevim.com.br", "https://www.podevim.com.br"],
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization"
}));

// Middlewares básicos
app.use(express.json());
app.use(morgan("dev"));

// 📌 Configuração do Swagger
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Generic API Project",
      version: "1.0.0",
      description: "API Documentation for Generic API Project",
    },
    servers: [
      {
        url: "https://api.podevim.com.br",
        description: "Servidor Produção"
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
  apis: ["./src/routes/*.js"], // Certifique-se de que os arquivos das rotas estão aqui
};

// 📌 Geração da documentação Swagger
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// 📌 Registra as rotas da API corretamente
app.use("/api/auth", authRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/user", userRoutes);

// 📌 Teste de rota raiz para verificar se a API está online
app.get("/", (req, res) => {
  res.json({
    status: "🔥 API is running!",
    docs: "https://api.podevim.com.br/api-docs"
  });
});

// 📌 Definição da porta e inicialização do servidor
const PORT = process.env.PORT || 5000;

sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Database connected!");
    return sequelize.sync();
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🔥 Server running on port ${PORT}`);
      console.log(`📄 Swagger documentation available at https://api.podevim.com.br/api-docs`);
    });
  })
  .catch((err) => {
    console.error("❌ Unable to connect to the database:", err);
  });

