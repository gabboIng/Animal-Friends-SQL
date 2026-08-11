import express from 'express';
const router = express.Router();
import mascotasModel from '../models/mascotas.js';

// ===== FUNCIÓN COMPARTIDA =====
async function obtenerMascotas(page = 1, limit = 6) {
    const total = await mascotasModel.countTotal();
    const totalPages = Math.ceil(total / limit);
    const mascotas = await mascotasModel.getPaginated(page, limit);

    return {
        mascotas,
        currentPage: page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextPage: page + 1,
        prevPage: page - 1
    };
}

// ===== PÁGINA INICIAL (HTML) =====
router.get('/', async (req, res) => {
    const data = await obtenerMascotas(1, 6);
    res.render('home', { ...data, mostrarLogout: true });
});

// ===== API JSON para fetch del paginador =====
router.get('/api/mascotas', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const data = await obtenerMascotas(page, limit);
    res.json(data);
});

//Crear Mascotas

router.get('/crear-mascota', (req, res) => { 
    res.render('crear-mascota', { mostrarLogout: true }); 
});

router.get('/registro', (req, res) => { res.render('registro', { mostrarLogin: true }); });
router.get('/login', (req, res) => { res.render('login', { mostrarRegistro: true }); });

export default router;
