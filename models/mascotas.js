import pool from '../config/dbClient.js';

class mascotasModelo {
    async create(mascota) {
        const { nombre, tipo, sexo, edad, adoptado, imagen, descripcion } = mascota;
        const result = await pool.query(
            `INSERT INTO mascotas (nombre, tipo, sexo, edad, adoptado, imagen, descripcion)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [nombre, tipo, sexo, edad, adoptado || false, imagen, descripcion]
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
            'SELECT * FROM mascotas ORDER BY created_at DESC'
        );
        return result.rows;
    }

    async getPaginated(page = 1, limit = 6) {
        const offset = (page - 1) * limit;
        const result = await pool.query(
            'SELECT * FROM mascotas WHERE adoptado = false ORDER BY created_at DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );
        return result.rows;
    }

    async countTotal() {
        const result = await pool.query(
            'SELECT COUNT(*) FROM mascotas WHERE adoptado = false'
        );
        return parseInt(result.rows[0].count);
    }

    async getOne(id) {
        const result = await pool.query(
            'SELECT * FROM mascotas WHERE id = $1', [id]
        );
        return result.rows[0];
    }
} 

export default new mascotasModelo();