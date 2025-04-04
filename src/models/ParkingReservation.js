const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ParkingReservation = sequelize.define("ParkingReservation", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    spot_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    parking_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    start_time: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    end_time: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    entry_time: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    exit_time: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED'),
        defaultValue: 'SCHEDULED',
        allowNull: false,
    },
    estimated_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    final_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    payment_method: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    transaction_id: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: "parking_reservations",
    timestamps: false,
});

module.exports = ParkingReservation;