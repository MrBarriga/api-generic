require("dotenv").config(); // Carrega as variáveis de ambiente do arquivo .env
const { Sequelize } = require("sequelize");

// Validações das variáveis de ambiente
if (!process.env.MYSQL_DB || !process.env.MYSQL_USER || !process.env.MYSQL_PASSWORD || !process.env.MYSQL_HOST) {
    console.error("❌ Erro: Variáveis de ambiente para configuração do banco de dados não foram definidas. Verifique o arquivo .env.");
    process.exit(1); // Finaliza a aplicação se as variáveis estiverem ausentes
}

// Inicializa a conexão com o banco de dados
const sequelize = new Sequelize(
    process.env.MYSQL_DB, // Nome do banco de dados
    process.env.MYSQL_USER, // Nome do usuário do banco
    process.env.MYSQL_PASSWORD, // Senha do banco de dados
    {
        host: process.env.MYSQL_HOST, // Host do banco de dados
        port: process.env.MYSQL_PORT || 3306, // Porta do MySQL
        dialect: "mysql", // Dialeto do banco (MySQL)
        logging: false, // Desativa logs do Sequelize
        pool: { // Configurações adicionais do pool de conexões
            max: 5, // Número máximo de conexões no pool
            min: 0, // Número mínimo de conexões no pool
            acquire: 30000, // Tempo máximo para adquirir uma conexão antes de erro
            idle: 10000 // Tempo máximo que uma conexão pode ficar inativa antes de ser liberada
        }
    }
);

// Teste de Conexão
(async () => {
    try {
        await sequelize.authenticate();
        console.log("✅ Conectado ao banco de dados com sucesso!");

        // Sincroniza os modelos com o banco de dados, criando tabelas se necessário
        await sequelize.sync({ alter: true });
        console.log("📦 Banco de dados sincronizado!");

    } catch (err) {
        console.error("🔥 Erro ao conectar ao banco de dados:", err);
        process.exit(1); // Finaliza a aplicação em caso de falha na conexão
    }
})();

module.exports = sequelize;
