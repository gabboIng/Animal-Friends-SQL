export const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }

    console.error('ERROR INESPERADO', err);
    res.status(500).json({
        status: 'error',
        message: 'Algo salió muy mal en el servidor.'
    });
};