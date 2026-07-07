require('dotenv').config();

const useOracle = process.env.USE_ORACLE === 'true';

let db;
if (useOracle) {
  db = require('./oracleDb');
  console.log('[DB] Using Oracle Database');
} else {
  db = require('./memoryDb');
  console.log('[DB] Using In-Memory Database');
}

module.exports = db;
