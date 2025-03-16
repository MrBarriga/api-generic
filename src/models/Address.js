const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./User");

const Address = sequelize.define("Address", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: User, // Relacionamento com User
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  },
  line1: { type: DataTypes.STRING, allowNull: false },
  line2: { type: DataTypes.STRING },
  city: { type: DataTypes.STRING, allowNull: false },
  state: { type: DataTypes.STRING, allowNull: false },
  postal_code: { type: DataTypes.STRING, allowNull: false },
  country: { type: DataTypes.STRING, allowNull: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: "addresses",
  timestamps: false,
});

// Definição do relacionamento
User.hasMany(Address, { foreignKey: "user_id" });
Address.belongsTo(User, { foreignKey: "user_id" });

module.exports = Address;
