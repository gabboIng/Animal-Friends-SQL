import sharp from 'sharp';
import fs from 'fs';

async function procesarImagen(rutaArchivo) {
    const rutaWebp = rutaArchivo.replace(/\.[^.]+$/, '.webp');
    const buffer = fs.readFileSync(rutaArchivo);
    await sharp(buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(rutaWebp);

    if (rutaArchivo !== rutaWebp) {
        fs.unlinkSync(rutaArchivo);
    }
}

export default procesarImagen;