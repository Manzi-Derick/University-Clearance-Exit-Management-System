const oracledb = require('oracledb');
require('dotenv').config();

// Oracle XE 11g requires Thick mode - point to the Oracle client libraries
try {
  oracledb.initOracleClient({ libDir: 'C:\\oraclexe\\app\\oracle\\product\\11.2.0\\server\\bin' });
} catch (err) {
  // Already initialized or not available
}

let pool;

async function initialize() {
  try {
    pool = await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECTION_STRING,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 1
    });
    console.log('Oracle DB connection pool created');
  } catch (err) {
    console.error('Failed to create Oracle DB pool:', err.message);
    console.log('Running in demo mode with in-memory data');
  }
}

async function getConnection() {
  if (!pool) return null;
  return await pool.getConnection();
}

async function closePool() {
  if (pool) {
    await pool.close(0);
    console.log('Oracle DB pool closed');
  }
}

module.exports = { initialize, getConnection, closePool };
