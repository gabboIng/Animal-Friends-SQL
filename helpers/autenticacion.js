import jwt from 'jsonwebtoken';

export function generarToken(usuario) {
    const payload = {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email
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
        //res.status(200).json({ status: "success", message: "Token válido" });
        next();
    } catch (e) {
        return res.status(401).json({ status: "error", message: "Token inválido" });
    }
}       
 

export default { generarToken, verificarToken };