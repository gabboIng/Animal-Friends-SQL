import multer from 'multer';

export const globalErrorHandler = (err, req, res, next) => {
    // Errores de subida de archivos (multer): se responden como 400 controlado
    // en lugar de un 500 genérico, cumpliendo "validar tipo y tamaño en la subida".
    const mensajesMulter = {
        LIMIT_FILE_SIZE: 'El archivo supera el tamaño máximo permitido (10 MB)'
    };
    if (err instanceof multer.MulterError) {
        err.statusCode = 400;
        err.message = mensajesMulter[err.code] || `Error en la subida del archivo (${err.code})`;
        err.isOperational = true;
    } else if (err.message === 'Solo se permiten imágenes') {
        err.statusCode = 400;
        err.isOperational = true;
    }

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // API requests (rutas /api/ o Accept: application/json) → JSON
    const isApi = req.path.startsWith('/api') || req.accepts('json');
    if (isApi) {
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        }
        console.error('ERROR INESPERADO', err);
        return res.status(500).json({
            status: 'error',
            message: '!Oh no¡ Parece que nos hemos perdido.'
        });
    }

    // Browser requests → HTML
    let titulo, mensaje;
    if (err.statusCode === 404) {
        titulo = 'Página no encontrada';
        mensaje = err.message || '!Oh no¡ Parece que nos hemos perdido.';
    } else if (err.statusCode >= 400 && err.statusCode < 500) {
        titulo = 'Algo salió mal';
        mensaje = err.message || 'Hubo un problema con tu solicitud.';
    } else {
        titulo = 'Error del servidor';
        mensaje = 'Algo salió muy mal en el servidor. Intentá más tarde.';
    }
    return res.status(err.statusCode).render('error', {
        statusCode: err.statusCode,
        titulo,
        mensaje,
        mostrarLogout: true
    });
};