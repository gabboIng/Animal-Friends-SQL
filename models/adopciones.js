import pool from '../config/dbClient.js';

class adopcionesModelo {
    async adoptar(usuario_id, mascota_id) {
        const result = await pool.query(
            `INSERT INTO adopciones (usuario_id, mascota_id)
             VALUES ($1, $2) RETURNING *`,
            [usuario_id, mascota_id]
        );
        return result.rows[0];
    }

    async getAdopciones() {
        const result = await pool.query(`
            SELECT a.*, m.nombre AS mascota_nombre, u.nombre AS usuario_nombre
            FROM adopciones a
            JOIN mascotas m ON a.mascota_id = m.id
            JOIN usuarios u ON a.usuario_id = u.id
            ORDER BY a.fecha_adopcion DESC
        `);
        return result.rows;
    }

    async getByMascota(mascota_id) {
        const result = await pool.query(
            'SELECT * FROM adopciones WHERE mascota_id = $1', [mascota_id]
        );
        return result.rows[0];
    }
}

export default new adopcionesModelo();