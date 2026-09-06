import usuariosModel from '../models/usuario.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';

class adminController {
    constructor() {}

    listarUsuarios = catchAsync(async (req, res, next) => {
        const data = await usuariosModel.getAllConAdopcionesPublicadas();
        res.status(200).json({ status: 'ok', data });
    });

    obtenerUsuario = catchAsync(async (req, res, next) => {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return next(new AppError('ID inválido', 400));

        const usuario = await usuariosModel.getByIdConAdopciones(id);
        if (!usuario) return next(new AppError('Usuario no encontrado', 404));

        res.status(200).json({ status: 'ok', data: usuario });
    });

    editarUsuario = catchAsync(async (req, res, next) => {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return next(new AppError('ID inválido', 400));

        const { nombre, apellido, email, telefono, rol } = req.body;
        if (!nombre || !apellido || !email) {
            return next(new AppError('Nombre, apellido y email son obligatorios', 400));
        }

        const usuario = await usuariosModel.getById(id);
        if (!usuario) return next(new AppError('Usuario no encontrado', 404));

        // Verificar si el email ya existe en otro usuario
        const existeEmail = await usuariosModel.getOneByEmail(email);
        if (existeEmail && existeEmail.id !== id) {
            return next(new AppError('El email ya está registrado en otro usuario', 409));
        }

        await usuariosModel.updateById(id, { nombre, apellido, email, telefono, rol });

        res.status(200).json({ status: 'ok', message: 'Usuario actualizado correctamente' });
    });

    eliminarUsuario = catchAsync(async (req, res, next) => {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return next(new AppError('ID inválido', 400));

        if (id === req.usuario.id) {
            return next(new AppError('No puedes eliminar tu propia cuenta', 400));
        }

        // Verificar si el usuario tiene adopciones gestionadas por otros
        const tieneAdopcionesAjenas = await usuariosModel.tieneAdopcionesDeOtros(id);
        if (tieneAdopcionesAjenas) {
            return next(new AppError(
                'No se puede eliminar este usuario porque tiene adopciones gestionadas por otros usuarios.',
                409
            ));
        }

        // Soft delete: desactivar usuario, mascotas y adopciones
        await usuariosModel.softDeleteById(id);

        res.status(200).json({ status: 'ok', message: 'Usuario eliminado correctamente' });
    });
}

export default new adminController();