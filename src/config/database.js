require("dotenv").config(); // Certifique-se de carregar o dotenv no início

const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
    process.env.MYSQL_DB,            // Nome do banco de dados
    process.env.MYSQL_USER,          // Nome do usuário
    process.env.MYSQL_PASSWORD,      // Senha do banco de dados
    {
        host: process.env.MYSQL_HOST,  // Host do banco de dados
        dialect: "mysql",              // Dialeto do banco (MySQL)
        logging: false,                // Desativa logs do Sequelize (opcional)
    }
);

// Teste de Conexão (opcional)
sequelize.authenticate()
    .then(() => console.log("Conectado ao banco de dados com sucesso!"))
    .catch(err => console.error("Erro ao conectar ao banco de dados:", err));

module.exports = sequelize;
