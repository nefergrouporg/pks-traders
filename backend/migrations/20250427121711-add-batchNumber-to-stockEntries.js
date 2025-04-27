"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      "StockEntries", 
      "batchNumber", 
      {
        type: Sequelize.STRING, 
        allowNull: true, 
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      "StockEntries", 
      "batchNumber" 
    );
  },
};