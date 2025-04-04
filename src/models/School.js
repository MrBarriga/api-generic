const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const School = sequelize.define("School", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    cnpj: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    phone_number: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true,
        },
    },
    website: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    logo: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    operation_hours: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    responsible_user_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'PENDING'),
        defaultValue: 'ACTIVE',
        allowNull: false,
    },
    settings: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    plan: {
        type: DataTypes.ENUM('BASIC', 'PREMIUM', 'ENTERPRISE'),
        defaultValue: 'BASIC',
        allowNull: false,
    },
    notification_radius: {
        type: DataTypes.INTEGER,
        defaultValue: 500, // 500 metros
        allowNull: false,
    },
}, {
    tableName: "schools",
    timestamps: false,
});

module.exports = School;