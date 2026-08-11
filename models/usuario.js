import Usuario from "../schema/usuarios.js";


class usuariosModelo{
    async create(usuario){
        return await Usuario.create(usuario);
    }

    async update(id, usuario){
        return await Usuario.findByIdAndUpdate(id, usuario, { new: true });
    }

    async delete(id){
        return await Usuario.findByIdAndDelete(id);
    }

    async getAll(){
        return await Usuario.find();
    }

    async getOne(id){
        return await Usuario.findById(id);
    }

    async getOneByEmail(email){
        return await Usuario.findOne({ email });
    }
}

export default new usuariosModelo();
