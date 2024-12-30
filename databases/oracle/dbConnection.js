const oracledb = require('oracledb');

class DatabaseConnection {
  static async initialize() {
    if (!this.pool) {
      this.pool = await oracledb.createPool({
        user: 'test_schema',
        password: 'testpassword',
        connectString: 'localhost:1521/XE',
        poolMin: 1,
        poolMax: 1
      });
    }
  }

  static async close() {
    if (this.pool) {
      await this.pool.close();
    }
  }

  static async getConnection() {
    return this.pool.getConnection();
  }
}

module.exports = { DatabaseConnection };