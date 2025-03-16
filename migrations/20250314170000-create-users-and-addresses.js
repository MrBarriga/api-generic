'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Criando a tabela de usuários
        await queryInterface.createTable('users', {
            id: {
                type: Sequelize.STRING,
                primaryKey: true,
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            last_name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            phone_number: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            pro_number: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            email: {
                type: Sequelize.STRING,
                unique: true,
                allowNull: false,
            },
            password: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
                allowNull: false,
            },
            photo: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            reset_password_token: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            reset_password_expires: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            refresh_token: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            refresh_token_expires: {
                type: Sequelize.DATE,
                allowNull: true,
            },
        });

        // Criando a tabela de endereços
        await queryInterface.createTable('addresses', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            user_id: {
                type: Sequelize.STRING,
                allowNull: false,
                references: {
                    model: 'users', // Nome da tabela de referência
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            line1: { type: Sequelize.STRING, allowNull: false },
            line2: { type: Sequelize.STRING, allowNull: true },
            city: { type: Sequelize.STRING, allowNull: false },
            state: { type: Sequelize.STRING, allowNull: false },
            postal_code: { type: Sequelize.STRING, allowNull: false },
            country: { type: Sequelize.STRING, allowNull: false },
            created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('addresses');
        await queryInterface.dropTable('users');
    },
};
