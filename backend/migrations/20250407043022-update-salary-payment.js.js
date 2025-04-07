'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('SalaryPayments', 'incentive', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });

    await queryInterface.addColumn('SalaryPayments', 'cutOff', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });

    await queryInterface.addColumn('SalaryPayments', 'paid', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('SalaryPayments', 'incentive');
    await queryInterface.removeColumn('SalaryPayments', 'cutOff');
    await queryInterface.removeColumn('SalaryPayments', 'paid');
  }
};
