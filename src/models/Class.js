const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Class = sequelize.define("Class", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    school_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    level: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    period: {
        type: DataTypes.ENUM('MORNING', 'AFTERNOON', 'FULL_TIME'),
        allowNull: false,
    },
    entry_time: {
        type: DataTypes.TIME,
        allowNull: true,
    },
    exit_time: {
        type: DataTypes.TIME,
        allowNull: true,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: "classes",
    timestamps: false,
});

module.exports = Class;