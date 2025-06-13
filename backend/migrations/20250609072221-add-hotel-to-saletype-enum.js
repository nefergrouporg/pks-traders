"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Modify the enum to include 'hotel'
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Sale_saleType"
      ADD VALUE IF NOT EXISTS 'hotel';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback is tricky because ENUMs cannot remove values in Postgres easily
    // You can leave it empty or log a message
    console.warn("Rollback not supported for enum modification");
  },
};
