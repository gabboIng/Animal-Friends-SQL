import express from 'express';
const router = express.Router();
import uploadController from '../controllers/upload.js';
import upload from '../config/multer.js';
import { verificarToken } from '../helpers/autenticacion.js';

router.post('/', verificarToken, upload.single('archivo'), uploadController.subir);

export default router;