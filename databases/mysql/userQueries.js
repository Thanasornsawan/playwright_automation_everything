const { DatabaseConnection } = require('./mysqlConnection');

class UserQueries {
  static async getUserAccountBySite(site) {
    const pool = DatabaseConnection.getPool();
    try {
      // Added error logging
      console.log('Executing query for site:', site);
      
      const [rows] = await pool.execute(
        'SELECT username, password, site FROM users WHERE site = ?',
        [site]
      );

      console.log('Query results:', rows);
      return rows[0];
    } catch (error) {
      console.error('Error querying MySQL:', error);
      throw error;
    }
  }
}

module.exports = { UserQueries };