'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove columns from SalaryPayments
    await queryInterface.removeColumn('SalaryPayments', 'status');
    await queryInterface.removeColumn('SalaryPayments', 'incentive');
    await queryInterface.removeColumn('SalaryPayments', 'cutOff');
    await queryInterface.removeColumn('SalaryPayments', 'paid');
  },

  down: async (queryInterface, Sequelize) => {
    // Add columns back if rollback is needed
    await queryInterface.addColumn('SalaryPayments', 'status', {
      type: Sequelize.ENUM('paid', 'unpaid'),
      defaultValue: 'unpaid'
    });
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
  }
};