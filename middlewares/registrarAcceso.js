import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGS_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOGS_DIR, 'log.txt');

if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

const registrarAcceso = (req, res, next) => {
    const fecha = new Date().toLocaleString('es-CL');
    fs.appendFileSync(LOG_FILE, `[${fecha}] ${req.method} ${req.originalUrl}\n`);
    next();
};

export default registrarAcceso;
