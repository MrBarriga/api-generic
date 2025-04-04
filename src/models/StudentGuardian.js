const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const StudentGuardian = sequelize.define("StudentGuardian", {
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
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    relation: {
        type: DataTypes.STRING,
        allowNull: false, // Pai, Mãe, Avô, etc.
    },
    is_primary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    can_pickup: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
    },
    start_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    },
    end_date: {
        type: DataTypes.DATE,
        allowNull: true, // Para autorizações temporárias
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: "student_guardians",
    timestamps: false,
});

module.exports = StudentGuardian;