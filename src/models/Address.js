const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Address = sequelize.define("Address", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true, // Pode ser associado a um usuário
  },
  school_id: {
    type: DataTypes.UUID,
    allowNull: true, // Pode ser associado a uma escola
  },
  parking_id: {
    type: DataTypes.UUID,
    allowNull: true, // Pode ser associado a um estacionamento
  },
  line1: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  line2: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  postal_code: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  country: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Brasil',
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  address_type: {
    type: DataTypes.ENUM('RESIDENTIAL', 'COMMERCIAL', 'OTHER'),
    defaultValue: 'RESIDENTIAL',
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "addresses",
  timestamps: false,
});

module.exports = Address;