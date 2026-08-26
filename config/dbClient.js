import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Health-check al arranque: si la BD no responde, fallamos temprano (y logueamos)
// en vez de descubrirlo a media aplicación.
pool.query('SELECT NOW()')
    .then(() => console.log('Conexión a PostgreSQL establecida'))
    .catch(err => console.error('Error al conectar a PostgreSQL', err));

export default pool;
