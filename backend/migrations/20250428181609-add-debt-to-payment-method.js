'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Payments_paymentMethod" ADD VALUE IF NOT EXISTS 'debt';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Unfortunately, removing a value from a Postgres ENUM is not straightforward
    // You cannot remove an ENUM value easily without workarounds
    // So usually the down method is left empty or you recreate the enum
  }
};
