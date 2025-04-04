require("dotenv").config();
const { Sequelize } = require("sequelize");

const requiredEnvVars = ["MYSQL_DB", "MYSQL_USER", "MYSQL_PASSWORD", "MYSQL_HOST"];
const missingVars = requiredEnvVars.filter((env) => !process.env[env]);

if (missingVars.length > 0) {
    console.error(`❌ Erro: Variáveis de ambiente ausentes: ${missingVars.join(", ")}`);
    process.exit(1);
}

const sequelize = new Sequelize(
    process.env.MYSQL_DB,
    process.env.MYSQL_USER,
    process.env.MYSQL_PASSWORD,
    {
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT || 3306,
        dialect: "mysql",
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
    }
);

const connectToDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log("✅ Conectado ao banco de dados com sucesso!");

        const [results] = await sequelize.query("SHOW TABLES LIKE 'users';");

        if (results.length === 0) {
            console.log("⚡ Criando tabela 'users'...");
            await sequelize.sync({ force: true });
        } else {
            console.log("✅ Tabela 'users' já existe!");
            await sequelize.sync();
        }

        console.log("📦 Banco de dados sincronizado!");
    } catch (err) {
        console.error("🔥 Erro ao conectar ao banco de dados:", err);
        throw new Error("Falha ao conectar ao banco de dados");
    }
};

module.exports = { sequelize, connectToDatabase };
