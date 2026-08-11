import mascotasModel from '../models/mascotas.js';
import procesarImagen from '../config/procesarImagen.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';
import fs from 'fs';
import path from 'path';

const limpiarBody = (body) => {
    for (const key of Object.keys(body)) {
        if (body[key] === "") delete body[key];
    }
    return body;
};

class mascotasController {
    constructor() {}

    create = catchAsync(async (req, res, next) => {
        limpiarBody(req.body);
        if (req.file) {
            await procesarImagen(req.file.path);
            req.body.imagen = "/uploads/" + req.file.filename.replace(/\.[^.]+$/, '.webp');
        } else {
            req.body.imagen = "/img/imagen_De_Perfil.png";
        }
        if (!req.body.descripcion) {
            req.body.descripcion = "Easta mascota espera un hogar";
        }
        const data = await mascotasModel.create(req.body);
        res.status(201).json(data);
    });

    update = catchAsync(async (req, res, next) => {
        limpiarBody(req.body);
        if (req.file) {
            await procesarImagen(req.file.path);
            req.body.imagen = "/uploads/" + req.file.filename.replace(/\.[^.]+$/, '.webp');
        }
        const data = await mascotasModel.update(req.params.id, req.body);
        if (!data) return next(new AppError('Mascota no encontrada', 404));
        res.status(200).json(data);
    });

    delete = catchAsync(async (req, res, next) => {
        const mascota = await mascotasModel.getOne(req.params.id);
        if (!mascota) return next(new AppError('Mascota no encontrada', 404));

        if (mascota.imagen && mascota.imagen.startsWith('/uploads/')) {
            const filePath = path.join(process.cwd(), 'uploads', path.basename(mascota.imagen));
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await mascotasModel.delete(req.params.id);
        res.status(200).json({ status: 'ok', message: 'Mascota eliminada' });
    });

    getAll = catchAsync(async (req, res, next) => {
        const data = await mascotasModel.getAll();
        res.status(200).json(data);
    });

    getOne = catchAsync(async (req, res, next) => {
        const data = await mascotasModel.getOne(req.params.id);
        if (!data) return next(new AppError('Mascota no encontrada', 404));
        res.status(200).json(data);
    });
}

export default new mascotasController();