const { Pool } = require('pg');

class DatabaseConnection {
  static async initialize() {
    if (!this.pool) {
      this.pool = new Pool({
        user: 'testuser',
        password: 'testpassword',
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        // Optional settings for better performance
        max: 1, // Maximum number of clients
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
      });
    }
  }

  static async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  static async getConnection() {
    return this.pool.connect();
  }
}

module.exports = { DatabaseConnection };