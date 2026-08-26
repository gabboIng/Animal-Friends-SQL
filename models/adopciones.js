import pool from '../config/dbClient.js';
import { AppError } from '../utils/AppError.js';

class adopcionesModelo {
    async adoptar(usuario_id, mascota_id) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Bloquea la fila de la mascota hasta COMMIT/ROLLBACK
        const mascota = await client.query(
            'SELECT id FROM mascotas WHERE id = $1 FOR UPDATE', [mascota_id]
        );
        if (mascota.rowCount === 0) {
            throw new AppError('Mascota no encontrada', 404);
        }

        // Check atómico: ya no hay ventana entre "verificar" e "insertar"
        const yaAdoptada = await client.query(
            'SELECT id FROM adopciones WHERE mascota_id = $1', [mascota_id]
        );
        if (yaAdoptada.rowCount > 0) {
            throw new AppError('Esta mascota ya fue adoptada', 409);
        }

        const result = await client.query(
            'INSERT INTO adopciones (usuario_id, mascota_id) VALUES ($1, $2) RETURNING *',
            [usuario_id, mascota_id]
        );

        await client.query('COMMIT');
        return result.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
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