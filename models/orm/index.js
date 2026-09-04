import Usuario from './usuario.js';
import Mascota from './mascota.js';
import Adopcion from './adopcion.js';

// Un usuario publica muchas mascotas
Usuario.hasMany(Mascota, { foreignKey: 'usuario_id' });
Mascota.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Un usuario registra muchas adopciones
Usuario.hasMany(Adopcion, { foreignKey: 'usuario_id' });
Adopcion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Una mascota tiene como máximo una adopción
Mascota.hasOne(Adopcion, { foreignKey: 'mascota_id', as: 'adopcion' });
Adopcion.belongsTo(Mascota, { foreignKey: 'mascota_id', as: 'mascota' });

export { Usuario, Mascota, Adopcion };