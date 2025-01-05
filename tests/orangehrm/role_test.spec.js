const { test, expect } = require('@playwright/test');

// Create test fixtures for different roles
const adminTest = test.extend({
  storageState: '.auth/state-admin.json'
});

const employee1Test = test.extend({
  storageState: '.auth/state-employee1.json'
});

const employee2Test = test.extend({
  storageState: '.auth/state-employee2.json'
});

// Admin tests
adminTest('Admin can access Employee List', async ({ page }) => {
  await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/pim/viewEmployeeList');
  
  const employeeList = page.locator('div[class*="orangehrm-employee-list"]');
  await expect(employeeList).toBeVisible();
});

// Employee1 tests
employee1Test('Employee1 cannot access Employee List', async ({ page }) => {
  await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/pim/viewEmployeeList');
  
  const credentialAlert = page.locator('p[class*="alert"]');
  await expect(credentialAlert).toBeVisible();
  await expect(credentialAlert).toContainText('Credential Required');
});

// Employee2 tests
employee2Test('Employee2 cannot access Employee List', async ({ page }) => {
  await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/pim/viewEmployeeList');
  
  const credentialAlert = page.locator('p[class*="alert"]');
  await expect(credentialAlert).toBeVisible();
  await expect(credentialAlert).toContainText('Credential Required');
});