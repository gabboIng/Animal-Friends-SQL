import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    define: {
        underscored: true,
        timestamps: true
    }
});

// Health-check al arranque: si la BD no responde, fallamos temprano (y logueamos)
// en vez de descubrirlo a media aplicación.
sequelize.authenticate()
    .then(() => console.log('Conexión a PostgreSQL establecida'))
    .catch(err => console.error('Error al conectar a PostgreSQL', err));

export default sequelize;