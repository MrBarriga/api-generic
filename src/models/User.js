const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database"); // ✅ Corrigido aqui!

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    profile_photo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    last_access: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("ACTIVE", "INACTIVE", "SUSPENDED"),
      defaultValue: "ACTIVE",
      allowNull: false,
    },
    user_type: {
      type: DataTypes.ENUM("ADMIN", "SCHOOL", "PARENT", "STUDENT", "PARKING_PROVIDER"),
      allowNull: false,
    },
    two_factor_secret: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    two_factor_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    preferences: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    device_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reset_password_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reset_password_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    refresh_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    refresh_token_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    timestamps: false,
    hooks: {
      beforeCreate: (user) => {
        if (user.email) {
          user.email = user.email.toLowerCase().trim();
        }
        if (user.name) {
          user.name = user.name.trim();
        }
      },
      beforeUpdate: (user) => {
        if (user.changed("email") && user.email) {
          user.email = user.email.toLowerCase().trim();
        }
        if (user.changed("name") && user.name) {
          user.name = user.name.trim();
        }
      },
    },
  }
);

// Método de instância para retornar os dados sem informações sensíveis
User.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());

  delete values.password;
  delete values.refresh_token;
  delete values.refresh_token_expires;
  delete values.reset_password_token;
  delete values.reset_password_expires;
  delete values.two_factor_secret;

  return values;
};

module.exports = User;
