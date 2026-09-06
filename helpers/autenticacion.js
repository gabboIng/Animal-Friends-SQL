import jwt from 'jsonwebtoken';

// Payload mínimo a propósito (id, nombre, email, rol): el token viaja firmado en cada request
// y no debe cargar datos sensibles (ni clave ni datos personales).
export function generarToken(usuario) {
    const payload = {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    return token;
}
 
export function verificarToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];      
    if (!token) {
        return res.status(401).json({ status: "error", message: "Token no proporcionado" });
    }

    try{
        const dataToken = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = dataToken;
        next();
    } catch (e) {
        return res.status(401).json({ status: "error", message: "Token inválido" });
    }
}       
 

export default { generarToken, verificarToken };