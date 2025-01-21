const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// Define the download directory path relative to the project root
const downloadPath = path.join(__dirname, '../../download');

// Test suite for file downloads
test.describe('File Download Tests', () => {
    // Run before all tests
    test.beforeAll(async () => {
        // Ensure download directory exists
        if (!fs.existsSync(downloadPath)) {
            fs.mkdirSync(downloadPath, { recursive: true });
        }
    });

    // Run before each test
    test.beforeEach(async ({ page }) => {
        // Navigate to the file download page
        await page.goto('https://letcode.in/file');
        
        // Wait for the page to load completely
        await page.waitForLoadState('networkidle');
    });

    // Test Excel file download
    test('should download Excel file', async ({ page }) => {
        // Start waiting for download before clicking
        const downloadPromise = page.waitForEvent('download');
        
        // Click the Excel download button
        // Note: Update the selector based on the actual button on the page
        await page.click('text=Download Excel');
        
        // Wait for the download to start
        const download = await downloadPromise;
        
        // Specify the download path
        const filePath = path.join(downloadPath, 'sample.xlsx');
        
        // Save the downloaded file
        await download.saveAs(filePath);
        
        // Verify the file exists
        const fileExists = fs.existsSync(filePath);
        expect(fileExists).toBeTruthy();
        
        // Optional: Verify file size is greater than 0
        const stats = fs.statSync(filePath);
        expect(stats.size).toBeGreaterThan(0);
    });

    // Clean up after all tests
    test.afterAll(async () => {
        const excelPath = path.join(downloadPath, 'sample.xlsx');
        
        if (fs.existsSync(excelPath)) {
            fs.unlinkSync(excelPath);
        }
        
    });
});