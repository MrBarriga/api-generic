require('dotenv').config(); // Carrega as variáveis do .env

module.exports = {
  development: {
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
    host: process.env.MYSQL_HOST,
    dialect: "mysql",
    logging: console.log, // Ativa o log de SQL no console
    migrationStorageTableName: 'sequelize_migrations',
    // Adiciona esta propriedade para garantir que apenas migrations específicas sejam executadas
    migrations: {
      path: './src/migrations', // Ajuste para o caminho correto das suas migrations
      pattern: /^20250327191853-create-podevim-schema\.js$/ // Padrão regex para filtrar apenas a migration desejada
    }
  },
  test: {
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: `${process.env.MYSQL_DB}_test`,
    host: process.env.MYSQL_HOST,
    dialect: "mysql",
    logging: false, // Desativa logs em ambiente de teste
    migrationStorageTableName: 'sequelize_migrations',
    // Mesma configuração para ambiente de teste
    migrations: {
      path: './src/migrations',
      pattern: /^20250327191853-create-podevim-schema\.js$/
    }
  },
  production: {
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: `${process.env.MYSQL_DB}_prod`,
    host: process.env.MYSQL_HOST,
    dialect: "mysql",
    logging: false, // Desativa logs em ambiente de produção
    migrationStorageTableName: 'sequelize_migrations',
    // Mesma configuração para ambiente de produção
    migrations: {
      path: './src/migrations',
      pattern: /^20250327191853-create-podevim-schema\.js$/
    }
  }
};