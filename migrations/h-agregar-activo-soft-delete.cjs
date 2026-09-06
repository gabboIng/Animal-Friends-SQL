'use strict';

module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            ALTER TABLE mascotas ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;
            ALTER TABLE adopciones ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;
        `);
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`
            ALTER TABLE mascotas DROP COLUMN IF EXISTS activo;
            ALTER TABLE adopciones DROP COLUMN IF EXISTS activo;
        `);
    }
};