"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("Products", "wholeSalePrice", {
      type: Sequelize.FLOAT,
      allowNull: true,
      defaultValue: null, // Optional, keep or remove as you prefer
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("Products", "wholeSalePrice", {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0, // revert to original behavior
    });
  },
};
