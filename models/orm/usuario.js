import { DataTypes } from 'sequelize';
import sequelize from '../../config/dbClient.js';

const Usuario = sequelize.define('Usuario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    apellido: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    clave: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    telefono: {
        type: DataTypes.DECIMAL,
        allowNull: true
    }
}, {
    tableName: 'usuarios',
    timestamps: true,
    underscored: true
});

export default Usuario;