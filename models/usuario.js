import { Op } from 'sequelize';
import { Usuario, Adopcion, Mascota } from './orm/index.js';
import { registrarTransaccionFallida } from '../utils/loggerTransaccion.js';

class usuariosModelo {
    async create(usuario) {
        const result = await Usuario.create(usuario);
        return result.toJSON();
    }

    async getOneByEmail(email) {
        const result = await Usuario.findOne({ where: { email } });
        return result ? result.toJSON() : null;
    }

    // Lista todos los usuarios activos (sin clave) con sus mascotas publicadas y adoptadas.
    // Acepta filtros opcionales por nombre/apellido, email y rol (?nombre=&email=&rol=).
    async getAllConAdopcionesPublicadas({ nombre = '', email = '', rol = '' } = {}) {
        const where = { activo: true };

        if (rol) where.rol = rol;
        if (email) where.email = { [Op.iLike]: `%${email}%` };
        if (nombre) {
            where[Op.or] = [
                { nombre: { [Op.iLike]: `%${nombre}%` } },
                { apellido: { [Op.iLike]: `%${nombre}%` } }
            ];
        }

        const rows = await Usuario.findAll({
            where,
            attributes: { exclude: ['clave'] },
            include: [
                {
                    model: Mascota,
                    as: 'mascotas',
                    attributes: ['id', 'nombre'],
                    required: false,
                    where: { activo: true }
                },
                {
                    model: Adopcion,
                    as: 'adopciones',
                    required: false,
                    where: { activo: true },
                    include: [
                        {
                            model: Mascota,
                            as: 'mascota',
                            attributes: ['id', 'nombre'],
                            where: { activo: true }
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        return rows.map((usuario) => {
            const data = usuario.toJSON();
            data.mascotas_publicadas = (data.mascotas || []).map((m) => m.nombre);
            data.mascotas_adoptadas = (data.adopciones || []).map((a) => a.mascota?.nombre ?? null);
            delete data.mascotas;
            delete data.adopciones;
            return data;
        });
    }

    // Obtiene un usuario por ID (sin clave)
    async getById(id) {
        const result = await Usuario.findByPk(id, { attributes: { exclude: ['clave'] } });
        return result ? result.toJSON() : null;
    }

    // Obtiene un usuario por ID con sus mascotas publicadas y adoptadas (solo activos)
    async getByIdConAdopciones(id) {
        const result = await Usuario.findByPk(id, {
            attributes: { exclude: ['clave'] },
            include: [
                {
                    model: Mascota,
                    as: 'mascotas',
                    attributes: ['id', 'nombre'],
                    required: false,
                    where: { activo: true }
                },
                {
                    model: Adopcion,
                    as: 'adopciones',
                    required: false,
                    where: { activo: true },
                    include: [
                        {
                            model: Mascota,
                            as: 'mascota',
                            attributes: ['id', 'nombre'],
                            where: { activo: true }
                        }
                    ]
                }
            ]
        });

        if (!result) return null;

        const data = result.toJSON();
        data.mascotas_publicadas = (data.mascotas || []).map((m) => m.nombre);
        data.mascotas_adoptadas = (data.adopciones || []).map((a) => a.mascota?.nombre ?? null);
        delete data.mascotas;
        delete data.adopciones;
        return data;
    }

    // Verifica si un usuario tiene adopciones gestionadas por OTROS usuarios
    async tieneAdopcionesDeOtros(usuarioId) {
        const count = await Adopcion.count({
            where: { activo: true },
            include: [
                {
                    model: Mascota,
                    as: 'mascota',
                    where: { usuario_id: usuarioId, activo: true },
                    attributes: []
                },
                {
                    model: Usuario,
                    as: 'usuario',
                    where: { id: { [Symbol.for('ne')]: usuarioId } },
                    attributes: []
                }
            ]
        });
        return count > 0;
    }

    // Soft delete: desactiva el usuario y todos sus datos
    async softDeleteById(usuarioId) {
        const { sequelize } = Mascota;
        try {
            return await sequelize.transaction(async (t) => {
                // Desactivar mascotas del usuario
                await Mascota.update(
                    { activo: false },
                    { where: { usuario_id: usuarioId }, transaction: t }
                );

                // Desactivar adopciones donde el usuario es adoptante
                await Adopcion.update(
                    { activo: false },
                    { where: { usuario_id: usuarioId }, transaction: t }
                );

                // Desactivar adopciones de mascotas del usuario (otros usuarios que adoptaron)
                // Primero obtener los IDs de las mascotas del usuario
                const mascotaIds = await Mascota.findAll({
                    where: { usuario_id: usuarioId },
                    attributes: ['id'],
                    transaction: t
                }).then((rows) => rows.map((r) => r.id));

                if (mascotaIds.length > 0) {
                    await Adopcion.update(
                        { activo: false },
                        { where: { mascota_id: mascotaIds }, transaction: t }
                    );
                }

                // Desactivar el usuario
                await Usuario.update(
                    { activo: false },
                    { where: { id: usuarioId }, transaction: t }
                );

                return { id: usuarioId };
            });
        } catch (error) {
            registrarTransaccionFallida(`softDeleteById (usuario ${usuarioId})`, error);
            throw error;
        }
    }

    // Actualiza un usuario por ID
    async updateById(id, campos) {
        const [count] = await Usuario.update(campos, { where: { id } });
        return count > 0;
    }
}

export default new usuariosModelo();