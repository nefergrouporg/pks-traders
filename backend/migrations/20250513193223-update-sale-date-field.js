"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn("Sales", "purchaseDate", "saleDate");
    await queryInterface.changeColumn("Sales", "saleDate", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn("Sales", "saleDate", "purchaseDate");
    await queryInterface.changeColumn("Sales", "purchaseDate", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
};
