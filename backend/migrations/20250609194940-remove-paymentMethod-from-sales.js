'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("Sale", "paymentMethod");
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("Sale", "paymentMethod", {
      type: Sequelize.ENUM("cash", "card", "upi", "debt"),
      allowNull: false,
    });
  },
};
