'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'refresh_token', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'reset_password_expires', // Opcional: Posiciona a coluna depois de 'reset_password_expires'
    });
    await queryInterface.addColumn('users', 'refresh_token_expires', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'refresh_token', // Opcional: Posiciona a coluna depois de 'refresh_token'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'refresh_token');
    await queryInterface.removeColumn('users', 'refresh_token_expires');
  }
};
