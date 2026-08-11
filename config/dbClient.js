import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.query('SELECT NOW()')
    .then(() => console.log('Conexión a PostgreSQL establecida'))
    .catch(err => console.error('Error al conectar a PostgreSQL', err));

export default pool;
