import { Usuario } from './orm/index.js';

class usuariosModelo {
    async create(usuario) {
        const result = await Usuario.create(usuario);
        return result.toJSON();
    }

    async getOneByEmail(email) {
        const result = await Usuario.findOne({ where: { email } });
        return result ? result.toJSON() : null;
    }
}

export default new usuariosModelo();