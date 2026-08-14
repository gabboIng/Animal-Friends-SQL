
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import routesMascotas from './routes/mascotas.js';
import routsPages from './routes/pages.js';
import dbClient from './config/dbClient.js';
import routesUsuario from './routes/usuario.js';
import { globalErrorHandler } from './middlewares/errorHandler.js';
import hbs from 'hbs';
import routesAdopciones from './routes/adopciones.js'
import registrarAcceso from './middlewares/registrarAcceso.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
hbs.registerPartials(path.join(__dirname, 'views', 'partials'));
hbs.registerHelper('formatDate', (fecha) => {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-CL');
});
hbs.registerHelper('eq', (a, b) => a === b);
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Expone la carpeta uploads como estática para poder ver las imágenes en el navegador
// (ej: http://localhost:5100/uploads/nombre-archivo.png)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(registrarAcceso);
app.use('/mascotas', routesMascotas);
app.use('/usuario', routesUsuario);
app.use('/adopciones',routesAdopciones)
app.use("/",routsPages);

app.use(globalErrorHandler);

try {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`El server esta corriendo en el puerto ${PORT}`);
  });       
} catch (e) {
  console.error('Error al levantar servidor :', e);
}

process.on('SIGINT', async () => {
  console.log('Cerrando la aplicación...');
  await dbClient.end();
  process.exit(0);
});