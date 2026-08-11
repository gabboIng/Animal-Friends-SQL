import mongoose from "mongoose";

const usuariosSchema = new mongoose.Schema({
    nombre: {type: String, required: true},
    apellido: {type: String, required: true},       
    email: {type: String, required: true, unique: true, trim: true, lowercase: true},
    clave: {type: String, required: true},
    telefono: {type: Number, required: false},
 }
);

export default mongoose.model("usuarios", usuariosSchema);