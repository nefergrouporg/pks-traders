"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Suppliers", "email", {
      type: Sequelize.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Suppliers", "email", {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    });
  },
};
