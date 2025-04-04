// No arquivo do seeder
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('users', [
      {
        id: 'b4b1a8ca-7c32-4ebb-a153-ab4d4fc92dc4',
        name: 'Admin User',
        email: 'admin@podevim.com',
        password: '$2a$10$XXXXXXXXXXX', // hash de "password"
        user_type: 'ADMIN',
        status: 'ACTIVE',
        created_at: new Date()
      },
      {
        id: 'f6cc7d49-f34a-41f0-91d3-0b8e56e0927a',
        name: 'School Manager',
        email: 'school@podevim.com',
        password: '$2a$10$XXXXXXXXXXX', // hash de "password"
        user_type: 'SCHOOL',
        status: 'ACTIVE',
        created_at: new Date()
      },
      // Mais usuários...
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('users', null, {});
  }
};