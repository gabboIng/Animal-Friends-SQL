import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Directorio donde se guardarán las imágenes subidas
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "..", "uploads");

// Crea la carpeta uploads si no existe
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de multer: dónde guardar y con qué nombre
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        // Nombre único (timestamp + aleatorio) conservando la extensión original.
        // La conversión a .webp la hace sharp después (config/procesarImagen.js), no aquí.
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
});

export default multer({
    storage,                    // Guarda en disco (carpeta uploads)
    limits: { fileSize: 10 * 1024 * 1024 }, // Tamaño máximo: 10 MB
    fileFilter: (req, file, cb) => {
        // Se valida el mimetype DECLARADO por el cliente, no el contenido real.
        // Suficiente para este ejercicio; en producción habría que chequear magic bytes.
        const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype);
        cb(ok ? null : new Error("Solo se permiten imágenes"), ok);
    }
});
