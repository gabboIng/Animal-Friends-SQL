import { AppError } from '../utils/AppError.js';

// Restringe una ruta a cuentas con rol 'admin'.
// Siempre se usa DESPUÉS de verificarToken, que deja req.usuario (id, rol...).
export function esAdmin(req, res, next) {
    if (req.usuario?.rol !== 'admin') {
        return next(new AppError('Se requieren permisos de administrador', 403));
    }
    next();
}

export default esAdmin;