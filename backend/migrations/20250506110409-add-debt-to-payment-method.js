'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'enum_Payments_paymentMethod' AND e.enumlabel = 'debt'
        ) THEN
          ALTER TYPE "enum_Payments_paymentMethod" ADD VALUE 'debt';
        END IF;
      END $$;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Sequelize can't remove ENUM values, so usually nothing here
  }
};
