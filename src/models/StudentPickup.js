const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const StudentPickup = sequelize.define("StudentPickup", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    student_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    guardian_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    school_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    request_time: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    },
    release_time: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    pickup_time: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    wait_time: {
        type: DataTypes.INTEGER,
        allowNull: true, // em minutos
    },
    status: {
        type: DataTypes.ENUM('REQUESTED', 'RELEASED', 'COMPLETED', 'CANCELLED'),
        defaultValue: 'REQUESTED',
        allowNull: false,
    },
    guardian_location: {
        type: DataTypes.GEOMETRY('POINT'),
        allowNull: true,
    },
    staff_id: {
        type: DataTypes.UUID,
        allowNull: true, // ID do funcionário que liberou o aluno
    },
    confirmation_photos: {
        type: DataTypes.JSON,
        allowNull: true, // Array de URLs
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
    tableName: "student_pickups",
    timestamps: false,
});

module.exports = StudentPickup;