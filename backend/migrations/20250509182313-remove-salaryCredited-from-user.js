'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove the column salaryCredited
    await queryInterface.removeColumn('Users', 'salaryCredited');
  },

  down: async (queryInterface, Sequelize) => {
    // Add the column salaryCredited back in rollback
    await queryInterface.addColumn('Users', 'salaryCredited', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  }
};