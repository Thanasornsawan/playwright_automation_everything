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

  static async getUserOrdersByProductAndPrice(orderList, maxPrice) {
    const pool = DatabaseConnection.getPool();
    
    const query = `
      SELECT 
        u.username, 
        o.order_id, 
        o.order_date, 
        p.product_name, 
        oi.quantity, 
        p.price, 
        ROUND(oi.quantity * p.price, 2) AS total_price
      FROM users u
      JOIN orders o ON u.user_id = o.user_id
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN products p ON oi.product_id = p.product_id
      WHERE p.product_name IN (${orderList.map(() => '?').join(', ')}) 
        AND (oi.quantity * p.price) < ?
      ORDER BY o.order_date;
    `;
    
    try {
      const [rows] = await pool.execute(query, [...orderList, maxPrice]);
      console.log('Query results:', rows);
      return rows;
    } catch (error) {
      console.error('Error executing query:', {
        query,
        parameters: [...orderList, maxPrice],
        error: error.message,
      });
      throw error;
    }
  }
}  

module.exports = { UserQueries };