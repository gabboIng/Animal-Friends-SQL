import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGS_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOGS_DIR, 'transacciones-fallidas.log');

if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

// Registra en un archivo plano las transacciones que terminaron en ROLLBACK,
// junto con la operación y el motivo del error.
export function registrarTransaccionFallida(operacion, error) {
    const fecha = new Date().toLocaleString('es-CL');
    const motivo = error?.message ?? String(error);
    fs.appendFileSync(LOG_FILE, `[${fecha}] ${operacion} -> ROLLBACK: ${motivo}\n`);
}

export default { registrarTransaccionFallida };