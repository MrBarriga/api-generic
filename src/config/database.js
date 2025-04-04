require("dotenv").config(); // Carrega as variáveis de ambiente do .env
const { Sequelize } = require("sequelize");

// Validações das variáveis de ambiente
const requiredEnvVars = ["MYSQL_DB", "MYSQL_USER", "MYSQL_PASSWORD", "MYSQL_HOST"];
const missingVars = requiredEnvVars.filter((env) => !process.env[env]);

if (missingVars.length > 0) {
    console.error(`❌ Erro: Variáveis de ambiente ausentes: ${missingVars.join(", ")}`);
    process.exit(1);
}

// Inicializa a conexão com o banco de dados
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

// Função para testar a conexão
const connectToDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log("✅ Conectado ao banco de dados com sucesso!");

        // 🚀 Verifica se a tabela existe antes de sincronizar
        const [results] = await sequelize.query("SHOW TABLES LIKE 'users';");

        if (results.length === 0) {
            console.log("⚡ Criando tabela 'users'...");
            await sequelize.sync({ force: true }); // Cria a tabela se não existir
        } else {
            console.log("✅ Tabela 'users' já existe!");
            await sequelize.sync(); // Apenas sincroniza sem modificar índices
        }

        console.log("📦 Banco de dados sincronizado!");
    } catch (err) {
        console.error("🔥 Erro ao conectar ao banco de dados:", err);
        throw new Error("Falha ao conectar ao banco de dados");
    }
};

// Exporta a conexão e a função de conexão
module.exports = { sequelize, connectToDatabase };
