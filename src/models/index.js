const sequelize = require("../config/database");
const User = require("./User");
const Address = require("./Address");

// Define as associações entre os modelos
User.hasMany(Address, { foreignKey: "user_id", onDelete: "CASCADE", onUpdate: "CASCADE" });
Address.belongsTo(User, { foreignKey: "user_id", onDelete: "CASCADE", onUpdate: "CASCADE" });

// Sincroniza os modelos com o banco de dados
(async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("📦 Modelos sincronizados com o banco de dados!");
  } catch (err) {
    console.error("🔥 Erro ao sincronizar modelos:", err);
  }
})();

module.exports = {
  sequelize,
  User,
  Address,
};
