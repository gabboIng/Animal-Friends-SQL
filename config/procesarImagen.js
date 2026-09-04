import sharp from 'sharp';
import fs from 'fs';

async function procesarImagen(rutaArchivo) {
    const rutaWebp = rutaArchivo.replace(/\.[^.]+$/, '.webp');
    const buffer = fs.readFileSync(rutaArchivo);
    // fit: 'inside' + withoutEnlargement: solo se achica (máx 1200px), nunca se amplía una imagen chica.
    // Sin esto, un PNG enorme destrozaría el rendimiento y el layout de las cards.
    await sharp(buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(rutaWebp);

    // El original era basura temporal de multer; tras convertir, se limpia del disco.
    if (rutaArchivo !== rutaWebp) {
        fs.unlinkSync(rutaArchivo);
    }
}

export default procesarImagen;