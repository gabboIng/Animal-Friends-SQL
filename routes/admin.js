import express from 'express';
const router = express.Router();
import adminController from '../controllers/admin.js';
import { verificarToken } from '../helpers/autenticacion.js';
import esAdmin from '../middlewares/esAdmin.js';

// Vista del panel (esqueleto; los datos salen del API protegido)
router.get('/', (req, res) => {
    res.render('admin-usuarios', { mostrarLogout: true });
});

// API protegida: solo cuentas con rol 'admin'
router.get('/api/usuarios', verificarToken, esAdmin, adminController.listarUsuarios);
router.get('/api/usuarios/:id', verificarToken, esAdmin, adminController.obtenerUsuario);
router.put('/api/usuarios/:id', verificarToken, esAdmin, adminController.editarUsuario);
router.delete('/api/usuarios/:id', verificarToken, esAdmin, adminController.eliminarUsuario);

export default router;