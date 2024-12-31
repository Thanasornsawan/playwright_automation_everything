const oracledb = require('oracledb');

class DatabaseConnection {
  static async initialize() {
    if (!this.pool) {
      this.pool = await oracledb.createPool({
        user: 'test_schema',
        password: 'testpassword',
        connectString: 'localhost:1521/XE',
        poolMin: 1,
        poolMax: 1,
        connectTimeout: 60, // Add timeout in seconds
        queueTimeout: 60000 // Queue timeout in milliseconds
      });
    }
  }

  static async close() {
    if (this.pool) {
    