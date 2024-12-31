const { test, expect } = require('@playwright/test');
const { DatabaseConnection } = require('../../databases/mysql/mysqlConnection');
const { UserQueries } = require('../../databases/mysql/userQueries');
const testData = require('../../data/testData.json');
import * as allure from "allure-js-commons";

test.beforeAll(async () => {
  await DatabaseConnection.initialize();
});

test.afterAll(async () => {
  await DatabaseConnection.close();
});

test('should retrieve user credentials by site', async ({ page }) => {
  const testUser = testData.testUsers[0];

  await allure.step(`Query user account for site: ${testUser.site}`, async () => {
    const userAccount = await UserQueries.getUserAccountBySite(testUser.site);

    // Attach user account details as a JSON file in the Allure report
    allure.attachment('User Account Details', JSON.stringify(userAccount, null, 2), 'application/json');

    // Validate the retrieved user account
    expect(userAccount).toMatchObject({
        username: testUser.username,
        password: testUser.password,
        site: testUser.site
      });
  
      console.log('Retrieved username:', userAccount.username);
      console.log('Retrieved password:', userAccount.password);
  });
});

test.only('should retrieve user order details', async ({ page }) => {
  const testUser = testData.testUsers[0];

  await allure.step(`Query order details for user: ${testUser.username}`, async () => {
    const orderDetails = await UserQueries.getUserOrderDetails();

    // Attach order details as a JSON file in the Allure report
    allure.attachment('Order Details', JSON.stringify(orderDetails, null, 2), 'application/json');

    // Validate that order details are returned (adjust based on your test data)
    expect(orderDetails).toBeInstanceOf(Array);
    expect(orderDetails.length).toBeGreaterThan(0); // Check if there are orders

    // Example: Check if order details contain valid product names and prices
    orderDetails.forEach(order => {
      expect(order).toHaveProperty('product_name');
      expect(order).toHaveProperty('price');
      expect(order).toHaveProperty('total_price');
    });

    console.log('Retrieved order details:', orderDetails);
  });
});
