require('dotenv').config(); // Carrega as variáveis do .env

module.exports = {
  development: {
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
    host: process.env.MYSQL_HOST,
    dialect: "mysql",
    logging: console.log, // Ativa o log de SQL no console
  },
  test: {
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: `${process.env.MYSQL_DB}_test`,
    host: process.env.MYSQL_HOST,
    dialect: "mysql",
    logging: false, // Desativa logs em ambiente de teste
  },
  production: {
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: `${process.env.MYSQL_DB}_prod`,
    host: process.env.MYSQL_HOST,
    dialect: "mysql",
    logging: false, // Desativa logs em ambiente de produção
  }
};
