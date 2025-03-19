const mysql = require('mysql2/promise');

// Crear un pool de conexiones
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', 
    password: '', 
    database: 'control_acceso',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Verificar la conexión al inicio
async function verifyConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conectado a la base de datos MySQL');
        connection.release(); // Liberar conexión al pool
    } catch (err) {
        console.error('❌ Error conectando a la base de datos:', err.code || err.message);
        throw err; // Detener la ejecución si la conexión falla
    }
}

// Llamar a la función de verificación solo en desarrollo (opcional)
if (process.env.NODE_ENV !== 'production') {
    verifyConnection();
}

module.exports = pool;
