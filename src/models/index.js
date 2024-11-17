const sequelize = require("../config/database");
const User = require("./User");
const Address = require("./Address");

// Define as associações entre os modelos
User.hasMany(Address, { foreignKey: "user_id" });
Address.belongsTo(User, { foreignKey: "user_id" });

module.exports = {
  sequelize,
  User,
  Address,
};
