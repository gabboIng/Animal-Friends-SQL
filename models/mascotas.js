import pool from '../config/dbClient.js';

class mascotasModelo {
    async create(mascota) {
        const { nombre, tipo, sexo, edad, imagen, descripcion, usuario_id } = mascota;
        const result = await pool.query(
            `INSERT INTO mascotas (nombre, tipo, sexo, edad, imagen, descripcion, usuario_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [nombre, tipo, sexo, edad, imagen, descripcion, usuario_id]
        );
        return result.rows[0];
    }

    async update(id, mascota) {
        const fields = [];
        const values = [];
        let i = 1;
        for (const [key, val] of Object.entries(mascota)) {
            fields.push(`${key} = $${i}`);
            values.push(val);
            i++;
        }
        fields.push(`updated_at = NOW()`);
        values.push(id);
        const result = await pool.query(
            `UPDATE mascotas SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
            values
        );
        return result.rows[0];
    }

    async delete(id) {
        const result = await pool.query(
            'DELETE FROM mascotas WHERE id = $1 RETURNING *', [id]
        );
        return result.rows[0];
    }

    async getAll() {
        const result = await pool.query(
            `SELECT m.*, a.fecha_adopcion, u.nombre AS adoptante_nombre
                FROM mascotas m
                LEFT JOIN adopciones a ON m.id = a.mascota_id
                LEFT JOIN usuarios u ON a.usuario_id = u.id
                ORDER BY m.created_at DESC`
        );
        return result.rows;
    }

    async getPaginated(page = 1, limit = 6) {
        const offset = (page - 1) * limit;
        const result = await pool.query(
            `SELECT m.*, a.fecha_adopcion, u.nombre AS adoptante_nombre
                FROM mascotas m
                LEFT JOIN adopciones a ON m.id = a.mascota_id
                LEFT JOIN usuarios u ON a.usuario_id = u.id
                ORDER BY m.created_at DESC LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        return result.rows;
    }

    async countTotal() {
        const result = await pool.query(
            `SELECT COUNT(*) FROM mascotas`
        );
        return parseInt(result.rows[0].count);
    }

    async getOne(id) {
        const result = await pool.query(
            `SELECT m.*, a.fecha_adopcion, u.nombre AS adoptante_nombre
                FROM mascotas m
                LEFT JOIN adopciones a ON m.id = a.mascota_id
                LEFT JOIN usuarios u ON a.usuario_id = u.id
                WHERE m.id = $1`, [id]
        );
        return result.rows[0];
    }
} 

export default new mascotasModelo();