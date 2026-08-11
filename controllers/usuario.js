import bcrypt from 'bcrypt';
import usuariosModel from '../models/usuario.js';
import { generarToken } from '../helpers/autenticacion.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';

class usuarioController {
    constructor() {}

    registrar = catchAsync(async (req, res, next) => {
        const { nombre, apellido, email, clave, telefono } = req.body;
        if (!nombre || !apellido || !email || !clave) {
            return next(new AppError('Todos los campos obligatorios deben ser completados', 400));
        }

        //verificar si el email existe
        const existe = await usuariosModel.getOneByEmail(email);
        if (existe) {
            return next(new AppError('El email ya está registrado', 409));
        }
        const hash = await bcrypt.hash(clave, 10);
        const data = await usuariosModel.create({ nombre, apellido, email, clave: hash, telefono });
        res.status(201).json({ status: "ok", message: "Usuario registrado exitosamente", usuario: data });
    });

    login = catchAsync(async (req, res, next) => {
        const { email, clave } = req.body;
        if (!email || !clave) {
            return next(new AppError('Email y clave son obligatorios', 400));
        }
        const usuario = await usuariosModel.getOneByEmail(email);
        if (!usuario) {
            return next(new AppError('Usuario no encontrado', 404));
        }
        const valid = await bcrypt.compare(clave, usuario.clave);
        if (!valid) {
            return next(new AppError('Contraseña incorrecta', 401));
        }
        const token = generarToken(usuario);
        res.status(200).json({ status: "ok", message: "Login exitoso", token, usuario: { id: usuario._id, nombre: usuario.nombre, email: usuario.email } });
    });
}

export default new usuarioController();