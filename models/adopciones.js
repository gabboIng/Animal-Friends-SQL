import sequelize from '../config/dbClient.js';
import { Mascota, Adopcion, Usuario } from './orm/index.js';
import { AppError } from '../utils/AppError.js';

class adopcionesModelo {
    async adoptar(usuario_id, mascota_id) {
        return await sequelize.transaction(async (t) => {
            // Bloquea la fila de la mascota hasta COMMIT/ROLLBACK (SELECT ... FOR UPDATE)
            const mascota = await Mascota.findByPk(mascota_id, {
                transaction: t,
                lock: t.LOCK.UPDATE
            });
            if (!mascota) {
                throw new AppError('Mascota no encontrada', 404);
            }
            if (!mascota.activo) {
                throw new AppError('Esta mascota no está disponible', 410);
            }

            // Check atómico: ya no hay ventana entre "verificar" e "insertar"
            const yaAdoptada = await Adopcion.findOne({
                where: { mascota_id, activo: true },
                transaction: t
            });
            if (yaAdoptada) {
                throw new AppError('Esta mascota ya fue adoptada', 409);
            }

            const result = await Adopcion.create(
                { usuario_id, mascota_id },
                { transaction: t }
            );
            return result.toJSON();
        });
    }

    // Soft delete: desactiva la adopción en vez de borrarla
    async softDelete(id) {
        const [count] = await Adopcion.update({ activo: false }, { where: { id } });
        return count > 0;
    }

    async getAdopciones() {
        const rows = await Adopcion.findAll({
            where: { activo: true },
            include: [
                { model: Mascota, as: 'mascota', attributes: ['nombre'], required: true, where: { activo: true } },
                { model: Usuario, as: 'usuario', attributes: ['nombre'], required: true }
            ],
            order: [['fecha_adopcion', 'DESC']]
        });
        return rows.map((a) => {
            const data = a.toJSON();
            data.mascota_nombre = data.mascota?.nombre ?? null;
            data.usuario_nombre = data.usuario?.nombre ?? null;
            delete data.mascota;
            delete data.usuario;
            return data;
        });
    }
}

export default new adopcionesModelo();