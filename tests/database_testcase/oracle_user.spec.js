const { test, expect } = require('@playwright/test');
const { DatabaseConnection } = require('../../databases/oracle/dbConnection');
const { UserQueries } = require('../../databases/oracle/userQueries');
const testData = require('../../data/testData.json');
const allure = require('allure-playwright');

test.beforeAll(async () => {
  await DatabaseConnection.initialize();
});

test.afterAll(async () => {
  await DatabaseConnection.close();
});

test('should retrieve user credentials by site @dbtest', async ({ page }) => {
  const testUser = testData.testUsers[0];
  
  await allure.step('Query user account', async () => {
    const userAccount = await UserQueries.getUserAccountBySite(testUser.site);
    
    await allure.attachment('User Account Details', JSON.stringify(userAccount, null, 2), 'application/json');
    
    expect(userAccount).toMatchObject({
      USERNAME: testUser.username,
      PASSWORD: testUser.password,
      SITE: testUser.site
    });

    console.log('Retrieved username:', userAccount.USERNAME);
    console.log('Retrieved password:', userAccount.PASSWORD);
  });
});