module.exports = {
    mongodb: {
      url: 'mongodb://testuser:testpassword@localhost:27017',
      database: 'sample_db',
      options: {
        authSource: 'admin',
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      }
    }
  };