import pool from '../config/dbClient.js';

class usuariosModelo {
    async create(usuario) {
        const { nombre, apellido, email, clave, telefono } = usuario;
        const result = await pool.query(
            `INSERT INTO usuarios (nombre, apellido, email, clave, telefono)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [nombre, apellido, email, clave, telefono]
        );
        return result.rows[0];
    }

    async getOneByEmail(email) {
        const result = await pool.query(
            'SELECT * FROM usuarios WHERE email = $1', [email]
        );
        return result.rows[0];
    }

    async getOne(id) {
        const result = await pool.query(
            'SELECT * FROM usuarios WHERE id = $1', [id]
        );
        return result.rows[0];
    }
}

export default new usuariosModelo();