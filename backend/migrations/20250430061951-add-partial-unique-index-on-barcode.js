'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX unique_barcode_not_null
      ON "Products" ("barcode")
      WHERE "barcode" IS NOT NULL;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DROP INDEX unique_barcode_not_null;
    `);
  }
};
