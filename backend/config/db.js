const mysql = require('mysql2/promise');
const mockDb = require('./mockDb');

let mysqlPool = null;
let useMock = false;

try {
  mysqlPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'softmulti_pro',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 4000,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  });

  // Test MySQL connection
  mysqlPool.query('SELECT 1').then(() => {
    console.log('✅ Connected to MySQL database successfully.');
  }).catch((err) => {
    console.warn(`⚠️ MySQL unreachable (${err.message}). Activating in-memory cloud demo database.`);
    useMock = true;
  });
} catch (err) {
  console.warn(`⚠️ Failed to initialize MySQL pool (${err.message}). Using in-memory fallback.`);
  useMock = true;
}

const poolAdapter = {
  async query(sql, params) {
    if (useMock) {
      return mockDb.query(sql, params);
    }
    try {
      return await mysqlPool.query(sql, params);
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT' || err.code === 'ER_BAD_DB_ERROR' || err.code === 'ER_ACCESS_DENIED_ERROR') {
        console.warn(`⚠️ MySQL connection error (${err.code}). Switching to in-memory cloud demo database.`);
        useMock = true;
        return mockDb.query(sql, params);
      }
      throw err;
    }
  },

  async getConnection() {
    if (useMock) {
      return {
        async beginTransaction() {},
        async commit() {},
        async rollback() {},
        async query(sql, params) { return mockDb.query(sql, params); },
        release() {}
      };
    }
    try {
      return await mysqlPool.getConnection();
    } catch (err) {
      console.warn(`⚠️ Failed to acquire MySQL connection (${err.code}). Using in-memory transaction.`);
      useMock = true;
      return {
        async beginTransaction() {},
        async commit() {},
        async rollback() {},
        async query(sql, params) { return mockDb.query(sql, params); },
        release() {}
      };
    }
  }
};

module.exports = poolAdapter;
