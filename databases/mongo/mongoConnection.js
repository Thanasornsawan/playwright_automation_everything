const { MongoClient } = require('mongodb');
const config = require('./mongoConfig');

class DatabaseConnection {
    static async initialize() {
        if (!this.client) {
          this.client = new MongoClient(config.mongodb.url, config.mongodb.options);
          await this.client.connect();
          this.db = this.client.db(config.mongodb.database);
        }
  }

  static async close() {
    if (this.client) {
      await this.client.close();
    }
  }

  static getDB() {
    return this.db;
  }
}

module.exports = { DatabaseConnection };