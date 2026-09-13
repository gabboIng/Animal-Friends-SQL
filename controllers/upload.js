import procesarImagen from '../config/procesarImagen.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';

class uploadController {
    constructor() {}

    subir = catchAsync(async (req, res, next) => {
        if (!req.file) {
            return next(new AppError('Debes enviar un archivo', 400));
        }

        await procesarImagen(req.file.path);

        const ruta = '/uploads/' + req.file.filename.replace(/\.[^.]+$/, '.webp');

        res.status(201).json({
            status: 'ok',
            message: 'Archivo subido correctamente',
            data: { url: ruta }
        });
    });
}

export default new uploadController();