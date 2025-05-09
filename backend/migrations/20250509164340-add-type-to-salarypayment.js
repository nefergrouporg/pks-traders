'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('SalaryPayments', 'type', {
      type: Sequelize.ENUM('advance', 'incentive'),
      allowNull: false,
      defaultValue: 'advance'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('SalaryPayments', 'type');
    // You may also need to drop the ENUM type in PostgreSQL manually or add this:
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_SalaryPayments_type";');
  }
};
