import { DataTypes } from 'sequelize';
import sequelize from '../../config/dbClient.js';

const Adopcion = sequelize.define('Adopcion', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'usuarios',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    mascota_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: 'mascotas',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    fecha_adopcion: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'adopciones',
    timestamps: false,
    underscored: true
});

export default Adopcion;