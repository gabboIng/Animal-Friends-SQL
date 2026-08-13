import express from 'express';
const router = express.Router();
import adopcionesController from '../controllers/adopciones.js';
import { verificarToken } from '../helpers/autenticacion.js';

router.post('/', verificarToken, adopcionesController.adoptar);
router.get('/', adopcionesController.getAdopciones);

export default router;