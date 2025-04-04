const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Student = sequelize.define("Student", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: true, // Opcional para estudantes muito jovens
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    birth_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    photo: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    class_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    school_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    exit_status: {
        type: DataTypes.ENUM('AT_SCHOOL', 'WAITING_EXIT', 'RELEASED', 'PICKED_UP'),
        defaultValue: 'AT_SCHOOL',
        allowNull: false,
    },
    special_needs: {
        type: DataTypes.TEXT,
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
    tableName: "students",
    timestamps: false,
});

module.exports = Student;