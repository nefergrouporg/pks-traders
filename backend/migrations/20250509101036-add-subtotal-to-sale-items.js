'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('sale_items', 'subtotal', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('sale_items', 'subtotal');
  }
};

