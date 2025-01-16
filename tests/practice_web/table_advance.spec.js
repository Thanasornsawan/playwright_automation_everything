const { test, expect } = require('@playwright/test');
const { TableHelper } = require('../../utils/advancedTableUtils');

test.describe('Advanced Table Testing', () => {
    let tableHelper;

    // Before each test, create a new TableHelper instance and navigate to the page
    test.beforeEach(async ({ page }) => {
        tableHelper = new TableHelper(page);
        await tableHelper.navigateToTable();
    });

    test('should handle entries dropdown correctly', async () => {
        // Test with 10 entries
        await tableHelper.setEntriesPerPage('10');
        expect(await tableHelper.getRowCount()).toBe(10);
        
        // Test with 5 entries
        await tableHelper.setEntriesPerPage('5');
        expect(await tableHelper.getRowCount()).toBe(5);
    });

    test('should perform search functionality correctly', async () => {
        // Test case 1: Search for 'aga'
        let rowCount = await tableHelper.searchAndVerifyText('aga');
        await tableHelper.verifyPaginationText(rowCount, 1);

        // Test case 2: Search for 'aul'
        rowCount = await tableHelper.searchAndVerifyText('aul');
        await tableHelper.verifyPaginationText(rowCount, 1);

        // Test case 3: Search for 'med'
        rowCount = await tableHelper.searchAndVerifyText('med');
        await tableHelper.verifyPaginationText(rowCount, 1);
    });

    test('should handle pagination correctly', async () => {
        const entriesPerPage = 5;
        
        // Set entries per page
        await tableHelper.setEntriesPerPage(String(entriesPerPage));
        
        // Verify first page
        await tableHelper.verifyPaginationText(entriesPerPage, 1);
        
        // Go to next page and verify
        await tableHelper.goToNextPage();
        await tableHelper.verifyPaginationText(entriesPerPage, 2);
    });
});