const { DatabaseConnection } = require('./pgConnection');

class UserQueries {
  static async getUserAccountBySite(site) {
    let client;
    try {
      client = await DatabaseConnection.getConnection();
      const query = {
        text: 'SELECT username, password, site FROM users WHERE site = $1',
        values: [site],
      };
      const result = await client.query(query);
      return result.rows[0];
    } finally {
      if (client) {
        client.release();
      }
    }
  }
}

module.exports = { UserQueries };