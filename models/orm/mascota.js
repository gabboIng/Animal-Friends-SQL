import { DataTypes } from 'sequelize';
import sequelize from '../../config/dbClient.js';

const Mascota = sequelize.define('Mascota', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    tipo: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    sexo: {
        type: DataTypes.STRING(10),
        allowNull: false
    },
    edad: {
        type: DataTypes.DECIMAL,
        allowNull: false
    },
    imagen: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'usuarios',
            key: 'id'
        },
        onDelete: 'CASCADE'
    }
}, {
    tableName: 'mascotas',
    timestamps: true,
    underscored: true
});

export default Mascota;