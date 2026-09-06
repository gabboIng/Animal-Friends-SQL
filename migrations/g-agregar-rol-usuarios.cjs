'use strict';

const bcrypt = require('bcrypt');

module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(20) NOT NULL DEFAULT 'usuario';
        `);

        const hash = bcrypt.hashSync('admin', 10);
        await queryInterface.sequelize.query(
            `INSERT INTO usuarios (nombre, apellido, email, clave, rol)
             VALUES ('Admin', 'Sistema', 'admin@admin', :clave, 'admin')
             ON CONFLICT (email) DO NOTHING`,
            { replacements: { clave: hash } }
        );
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`
            DELETE FROM usuarios WHERE email = 'admin@admin';
            ALTER TABLE usuarios DROP COLUMN IF EXISTS rol;
        `);
    }
};