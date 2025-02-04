const { test, expect } = require('@playwright/test');

test.describe('Test handle alert', () => {

    // Run before each test
    test.beforeEach(async ({ page }) => {
        // Navigate to the file download page
        await page.goto('https://testautomationpractice.blogspot.com/');
        
        // Wait for the page to load completely
        await page.waitForLoadState('networkidle');
    });

    test("Confirmation alert with ok", async ({ page }) => {
        // Enabling Alert Handling for Confirmation alert with OK
        page.on("dialog", async (dialog) => {
          expect(dialog.type()).toContain("confirm");
          expect(dialog.message()).toContain("Press a button!");
          await dialog.accept();
        });
      
        await page.waitForSelector("#confirmBtn");
        await page.locator("#confirmBtn").click();
        await expect(page.locator("#demo")).toHaveText("You pressed OK!");
      
        await page.waitForTimeout(5000);
      });

      test("Confirmation alert with Cancel", async ({ page }) => {
        // Enabling Alert Handling for Confirmation alert with Cancel
        page.on("dialog", async (dialog) => {
          expect(dialog.type()).toContain("confirm");
          expect(dialog.message()).toContain("Press a button!");
          await dialog.dismiss();
        });
      
        await page.waitForSelector("#confirmBtn");
        await page.locator("#confirmBtn").click();
        await expect(page.locator("#demo")).toHaveText("You pressed Cancel!");
      
        await page.waitForTimeout(5000);
      });

      test("Prompt alert", async ({ page }) => {
        // Handling prompt dialog
        page.on("dialog", async (dialog) => {
          expect(dialog.type()).toContain("prompt");
          expect(dialog.message()).toContain("Please enter your name:");
          expect(dialog.defaultValue()).toContain("Harry Potter");
          await dialog.accept("Thanasornsawan");
        });
      
        await page.waitForSelector("#promptBtn");
        await page.locator("#promptBtn").click();
        await expect(page.locator("#demo")).toHaveText(
          "Hello Thanasornsawan! How are you today?"
        );
      
        await page.waitForTimeout(5000);
      });

});