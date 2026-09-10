'use strict';

const bcrypt = require('bcrypt');

// Datos de ejemplo: 3 usuarios no administradores.
const USUARIOS = [
    { nombre: 'María', apellido: 'Valdivia', email: 'maria.valdivia@gmail.com', telefono: 912345678 },
    { nombre: 'Jorge', apellido: 'Ríos', email: 'jorge.rios@correo.cl', telefono: 923456789 },
    { nombre: 'Karla', apellido: 'López', email: 'karla.lopez@correo.cl', telefono: 934567890 }
];

// Mascotas publicadas por esos usuarios: [nombre, tipo, sexo, edad, descripcion, email_dueño]
const MASCOTAS = [
    ['Rex', 'Perro', 'Macho', 3, 'Perro salchicha juguetón y muy sociable, ideal para departamentos pequeños.', 'jorge.rios@correo.cl'],
    ['Luna', 'Gato', 'Hembra', 2, 'Gata tranquila que disfruta los mimos y dormir al sol.', 'maria.valdivia@gmail.com'],
    ['Rocky', 'Perro', 'Macho', 1, 'Cachorro bull terrier muy energético, necesita espacio para correr.', 'jorge.rios@correo.cl'],
    ['Michi', 'Gato', 'Macho', 4, 'Gato adulto independiente, convive bien con otros animales.', 'karla.lopez@correo.cl']
];

// Adopciones: [email_adoptante, email_dueño, nombre_mascota]
const ADOPCIONES = [
    ['karla.lopez@correo.cl', 'jorge.rios@correo.cl', 'Rex'],
    ['maria.valdivia@gmail.com', 'jorge.rios@correo.cl', 'Rocky'],
    ['jorge.rios@correo.cl', 'maria.valdivia@gmail.com', 'Luna']
];

module.exports = {
    async up(queryInterface) {
        const { sequelize } = queryInterface;
        const clave = bcrypt.hashSync('123456', 10);

        // 1) Usuarios de ejemplo (idempotente por email)
        for (const u of USUARIOS) {
            await sequelize.query(
                `INSERT INTO usuarios (nombre, apellido, email, clave, telefono, rol, activo)
                 VALUES (:nombre, :apellido, :email, :clave, :telefono, 'usuario', TRUE)
                 ON CONFLICT (email) DO NOTHING`,
                { replacements: { nombre: u.nombre, apellido: u.apellido, email: u.email, clave, telefono: u.telefono } }
            );
        }

        // Helper: id de un usuario por email
        const idUsuario = async (email) => {
            const [rows] = await sequelize.query(
                'SELECT id FROM usuarios WHERE email = :email',
                { replacements: { email } }
            );
            return rows[0]?.id;
        };

        // 2) Mascotas (idempotente por nombre + dueño)
        for (const [nombre, tipo, sexo, edad, descripcion, email] of MASCOTAS) {
            const usuario_id = await idUsuario(email);
            const existe = await sequelize.query(
                'SELECT id FROM mascotas WHERE nombre = :nombre AND usuario_id = :usuario_id',
                { replacements: { nombre, usuario_id } }
            ).then(([rows]) => rows[0]?.id);

            if (!existe) {
                await sequelize.query(
                    `INSERT INTO mascotas (nombre, tipo, sexo, edad, imagen, descripcion, usuario_id, activo)
                     VALUES (:nombre, :tipo, :sexo, :edad, '/img/mascotas.png', :descripcion, :usuario_id, TRUE)`,
                    { replacements: { nombre, tipo, sexo, edad, descripcion, usuario_id } }
                );
            }
        }

        // 3) Adopciones (idempotente por mascota; adoptante distinto del dueño)
        for (const [emailAdoptante, emailDueno, nombreMascota] of ADOPCIONES) {
            const adoptante_id = await idUsuario(emailAdoptante);
            const dueno_id = await idUsuario(emailDueno);
            const [mascotaRows] = await sequelize.query(
                `SELECT id FROM mascotas
                 WHERE nombre = :nombre AND usuario_id = :dueno_id`,
                { replacements: { nombre: nombreMascota, dueno_id } }
            );
            const mascota_id = mascotaRows[0]?.id;
            if (!mascota_id) continue;

            const [adopcionRows] = await sequelize.query(
                'SELECT id FROM adopciones WHERE mascota_id = :mascota_id',
                { replacements: { mascota_id } }
            );
            if (adopcionRows.length === 0) {
                await sequelize.query(
                    `INSERT INTO adopciones (usuario_id, mascota_id, fecha_adopcion, activo)
                     VALUES (:adoptante_id, :mascota_id, NOW(), TRUE)`,
                    { replacements: { adoptante_id, mascota_id } }
                );
            }
        }
    },

    async down(queryInterface) {
        const { sequelize } = queryInterface;
        const emails = USUARIOS.map((u) => `'${u.email}'`).join(', ');

        // Borrar solo los datos sembrados. El CASCADE de adopciones/mascotas
        // limpia automáticamente las filas dependientes de estos usuarios.
        await sequelize.query(`DELETE FROM usuarios WHERE email IN (${emails}) AND rol = 'usuario'`);
    }
};