'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('SaleItems', 'price', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0 // TEMP to avoid errors on old rows
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('SaleItems', 'price');
  }
};
