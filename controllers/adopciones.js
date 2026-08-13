import adopcionesModel from '../models/adopciones.js';
import mascotasModel from '../models/mascotas.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';

class adopcionesController {
    constructor() {}

    adoptar = catchAsync(async (req, res, next) => {
        const { mascota_id } = req.body;
        if (!mascota_id) {
            return next(new AppError('Se requiere mascota_id', 400));
        }

        const mascota = await mascotasModel.getOne(mascota_id);
        if (!mascota) return next(new AppError('Mascota no encontrada', 404));

        const yaAdoptada = await adopcionesModel.getByMascota(mascota_id);
        if (yaAdoptada) {
            return next(new AppError('Esta mascota ya fue adoptada', 409));
        }

        const data = await adopcionesModel.adoptar(req.usuario.id, mascota_id);
        res.status(201).json({ status: 'ok', message: 'Adopción registrada', adopcion: data });
    });

    getAdopciones = catchAsync(async (req, res, next) => {
        const data = await adopcionesModel.getAdopciones();
        res.status(200).json(data);
    });
}

export default new adopcionesController();