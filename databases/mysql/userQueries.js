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

      return rows[0];
    } catch (error) {
      console.error('Error querying MySQL:', error);
      throw error;
    }
  }

  static async getUserOrderDetails() {
    const pool = DatabaseConnection.getPool();
    try {

      const [rows] = await pool.execute(
        `
        SELECT
          u.username,
          u.site,
          o.order_id,
          o.order_date,
          p.product_name,
          oi.quantity,
          p.price,
          (oi.quantity * p.price) AS total_price
        FROM users u
        JOIN orders o ON u.user_id = o.user_id
        JOIN order_items oi ON o.order_id = oi.order_id
        JOIN products p ON oi.product_id = p.product_id
        ORDER BY o.order_date
        `,
      );

      // Return results as a dictionary (array of objects)
      return rows;
    } catch (error) {
      console.error('Error querying MySQL:', error);
      throw error;
    }
  }

}

module.exports = { UserQueries };