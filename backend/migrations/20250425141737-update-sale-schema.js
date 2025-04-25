'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Payments_paymentMethod" ADD VALUE 'debit';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback the change if needed (this part is more complex and may involve creating a new enum type)
  },
};
