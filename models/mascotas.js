import { Mascota, Adopcion, Usuario } from './orm/index.js';

const INCLUDE_ADOPCION_USUARIO = [
    { model: Adopcion, as: 'adopcion', attributes: ['fecha_adopcion'], required: false },
    { model: Usuario, as: 'usuario', attributes: ['nombre'], required: false }
];

// Aplana el resultado de Sequelize al mismo formato que devolvía el SQL
// anterior (mascotas con fecha_adopcion y adoptante_nombre al nivel raíz).
function aplanar(mascota) {
    const data = mascota.toJSON();
    data.fecha_adopcion = data.adopcion?.fecha_adopcion ?? null;
    data.adoptante_nombre = data.usuario?.nombre ?? null;
    delete data.adopcion;
    delete data.usuario;
    return data;
}

class mascotasModelo {
    async create(mascota) {
        const result = await Mascota.create(mascota);
        return result.toJSON();
    }

    async update(id, mascota) {
        const instancia = await Mascota.findByPk(id);
        if (!instancia) return null;
        return (await instancia.update(mascota)).toJSON();
    }

    async delete(id) {
        const instancia = await Mascota.findByPk(id);
        if (!instancia) return null;
        await instancia.destroy();
        return { id };
    }

    async getAll() {
        const rows = await Mascota.findAll({
            include: INCLUDE_ADOPCION_USUARIO,
            order: [['createdAt', 'DESC']]
        });
        return rows.map(aplanar);
    }

    async getPaginated(page = 1, limit = 6) {
        const offset = (page - 1) * limit;
        const rows = await Mascota.findAll({
            include: INCLUDE_ADOPCION_USUARIO,
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });
        return rows.map(aplanar);
    }

    async countTotal() {
        return Mascota.count();
    }

    async getOne(id) {
        const mascota = await Mascota.findByPk(id, { include: INCLUDE_ADOPCION_USUARIO });
        return mascota ? aplanar(mascota) : null;
    }
}

export default new mascotasModelo();