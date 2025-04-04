const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ParkingSpot = sequelize.define("ParkingSpot", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    parking_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    identifier: {
        type: DataTypes.STRING,
        allowNull: true, // Ex: "A-12", "B-03"
    },
    type: {
        type: DataTypes.ENUM('STANDARD', 'ACCESSIBLE', 'SENIOR', 'ELECTRIC', 'MOTORCYCLE'),
        defaultValue: 'STANDARD',
        allowNull: false,
    },
    dimensions: {
        type: DataTypes.JSON,
        allowNull: true, // {length, width, height}
    },
    price_minute: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    price_hour: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    price_day: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    price_month: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    availability: {
        type: DataTypes.JSON,
        allowNull: true, // Configurações de disponibilidade
    },
    status: {
        type: DataTypes.ENUM('AVAILABLE', 'OCCUPIED', 'RESERVED', 'UNAVAILABLE', 'MAINTENANCE'),
        defaultValue: 'AVAILABLE',
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: "parking_spots",
    timestamps: false,
});

module.exports = ParkingSpot;