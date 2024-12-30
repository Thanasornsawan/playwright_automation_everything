const oracledb = require('oracledb');
const { DatabaseConnection } = require('./dbConnection');

class UserQueries {
  static async getUserAccountBySite(site) {
    let connection;
    try {
      connection = await DatabaseConnection.getConnection();
      const result = await connection.execute(
        `SELECT username, password, site FROM users WHERE site = :site`,
        { site },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      return result.rows[0];
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }
}

module.exports = { UserQueries };