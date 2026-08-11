import express from "express";
const route = express.Router();
import mascotasController from "../controllers/mascotas.js";
import upload from "../config/multer.js";
import {verificarToken} from "../helpers/autenticacion.js";

// upload.single('imagen') procesa el archivo enviado en el campo 'imagen' (form-data)
route.post('/', verificarToken, upload.single('imagen'), mascotasController.create);
route.get('/:id',verificarToken, mascotasController.getOne);
// En el update también se permite subir/reemplazar la imagen
route.put('/:id',verificarToken, upload.single('imagen'), mascotasController.update);
route.delete('/:id', verificarToken, mascotasController.delete);
route.get('/', verificarToken, mascotasController.getAll);

export default route;
