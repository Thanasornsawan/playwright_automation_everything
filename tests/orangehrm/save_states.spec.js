const { test } = require('@playwright/test');
const { LoginPage } = require('../../web/pages/orangehrm/login_page');
const testData = require('../../data/orangehrm/testData.json');
const fs = require('fs').promises;
const path = require('path');

test('Save login states for users', async ({ browser }) => {
  // Ensure .auth directory exists
  const authDir = path.join(process.cwd(), '.auth');
  await fs.mkdir(authDir, { recursive: true });

  // Create separate contexts for each user
  const contexts = {
    admin: await browser.newContext(),
    employee1: await browser.newContext(),
    employee2: await browser.newContext()
  };

  try {
    // Create pages and login pages
    const loginPages = [];
    for (const [role, context] of Object.entries(contexts)) {
      const page = await context.newPage();
      loginPages.push({
        role,
        loginPage: new LoginPage(page)
      });
    }

    // Login and save states
    await Promise.all(
      loginPages.map(async ({ role, loginPage }) => {
        try {
          await loginPage.loginAndSaveState(
            testData[role].username,
            testData[role].password,
            path.join(authDir, `state-${role}.json`)
          );
          console.log(`Successfully saved state for ${role}`);
        } catch (error) {
          console.error(`Failed to save state for ${role}:`, error);
          throw error;
        }
      })
   