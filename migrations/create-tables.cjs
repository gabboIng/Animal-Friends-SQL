'use strict';

module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                apellido VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                clave VARCHAR(255) NOT NULL,
                telefono NUMERIC,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS mascotas (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                tipo VARCHAR(255) NOT NULL,
                sexo VARCHAR(10) NOT NULL CHECK (sexo IN ('Macho', 'Hembra')),
                edad NUMERIC NOT NULL CHECK (edad >= 0 AND edad <= 30),
                imagen VARCHAR(500),
                descripcion TEXT,
                usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS adopciones (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
                mascota_id INTEGER NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
                fecha_adopcion TIMESTAMP DEFAULT NOW(),
                UNIQUE(mascota_id)
            );
        `);
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`
            DROP TABLE IF EXISTS adopciones;
            DROP TABLE IF EXISTS mascotas;
            DROP TABLE IF EXISTS usuarios;
        `);
    }
};