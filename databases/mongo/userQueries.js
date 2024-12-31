const { DatabaseConnection } = require('./mongoConnection');

class UserQueries {
  static async getUserAccountBySite(site) {
    try {
      const db = DatabaseConnection.getDB();
      const result = await db.collection('users').findOne(
        { site: site },
        { projection: { _id: 0 } }  // Exclude _id field from result
      );
      return result;
    } catch (error) {
      console.error('Error querying MongoDB:', error);
      throw error;
    }
  }
}

module.exports = { UserQueries };