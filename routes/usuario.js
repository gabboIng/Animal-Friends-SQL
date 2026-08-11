import express from 'express';
const router = express.Router();
import usuarioController from '../controllers/usuario.js';

router.post('/registrar', usuarioController.registrar);
router.post('/login', usuarioController.login);

export default router;