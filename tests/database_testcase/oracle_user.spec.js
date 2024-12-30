const { test, expect } = require('@playwright/test');
const { DatabaseConnection } = require('../../databases/oracle/dbConnection');
const { UserQueries } = require('../../databases/oracle/userQueries');
const testData = require('../../data/testData.json');

test.beforeAll(async () => {
    await DatabaseConnection.initialize();
  });
  
  test.afterAll(async () => {
    await DatabaseConnection.close();
  });
  
  test('should retrieve user credentials by site', async () => {
    const testUser = testData.testUsers[0];
    const userAccount = await UserQueries.getUserAccountBySite(testUser.site);
    
    expect(userAccount).toMatchObject({
      USERNAME: testUser.username,
      PASSWORD: testUser.password,
      SITE: testUser.site
    });
  });