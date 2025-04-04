const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Parking = sequelize.define("Parking", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    owner_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM('COMMERCIAL', 'RESIDENTIAL', 'LAND'),
        allowNull: false,
    },
    coordinates: {
        type: DataTypes.GEOMETRY('POINT'),
        allowNull: false,
    },
    photos: {
        type: DataTypes.JSON,
        allowNull: true, // Array de URLs
    },
    operation_hours: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    rules: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'PENDING_APPROVAL'),
        defaultValue: 'PENDING_APPROVAL',
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    average_rating: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        allowNull: false,
    },
    total_ratings: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
    },
}, {
    tableName: "parkings",
    timestamps: false,
});

module.exports = Parking;