const mysql = require('mysql2/promise');

class DatabaseConnection {
  static async initialize() {
    if (!this.pool) {
      this.pool = mysql.createPool({
        host: 'localhost',
        port: 3311,
        user: 'testuser',        
        password: 'testpass', 
        database: 'testdb',      
        waitForConnections: true,
        connectionLimit: 1,
        queueLimit: 0,
        connectTimeout: 10000
      });

      // Test connection
      try {
        const connection = await this.pool.getConnection();
        console.log('Successfully connected to MySQL');
        connection.release();
      } catch (err) {
        console.error('Error connecting to MySQL:', err.message, err);
        throw err;
      }
    }
  }

  static async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  static getPool() {
    return this.pool;
  }
}

module.exports = { DatabaseConnection };