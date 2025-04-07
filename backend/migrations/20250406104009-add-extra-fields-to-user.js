"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.addColumn("Users", "age", {
        type: Sequelize.INTEGER,
        allowNull: true,
      }),
      queryInterface.addColumn("Users", "gender", {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn("Users", "aadharNumber", {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn("Users", "address", {
        type: Sequelize.STRING,
        allowNull: true,
      }),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.removeColumn("Users", "age"),
      queryInterface.removeColumn("Users", "gender"),
      queryInterface.removeColumn("Users", "aadharNumber"),
      queryInterface.removeColumn("Users", "address"),
    ]);
  },
};
