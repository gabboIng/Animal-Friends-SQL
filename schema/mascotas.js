import mongoose from 'mongoose';

const mascotasSchema = new mongoose.Schema({
        nombre: { type: String, required: true, },
        tipo: { type: String, required: true, },
        sexo: { type: String, enum: ['Macho', 'Hembra'], required: true, },
        edad: { type: Number, required: true, min: [0, 'La edad no puede ser negativa'], max: [30, 'La edad no puede ser mayor a 30',] },
        adoptado: { type: Boolean, default: false, },
        imagen: { type: String, required: false, },
        descripcion: { type: String, required: false, }

    }, { timestamps: true }

);

export default mongoose.model('mascota', mascotasSchema);