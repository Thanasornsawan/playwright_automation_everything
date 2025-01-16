const { test, expect } = require('@playwright/test');

/**
 * Test Case 1: Shopping List Total Validation
 * We'll demonstrate three different approaches to sum prices
 */

// Approach 1: Using simple for...of loop
test('Shopping List - Simple Loop Approach', async ({ page }) => {
    // Navigate to the page
    await page.goto('https://letcode.in/table');
    
    // Get all price cells using locator - this returns a Locator object
    const priceCells = page.locator('#shopping tbody tr td:nth-child(2)');
    
    // Get all text contents as an array of strings
    let total = 0;
    const allPrices = await priceCells.allTextContents();
    
    // Simple loop to sum up prices
    for (const price of allPrices) {
        total += parseFloat(price);
    }
    
    // Get displayed total and compare
    const displayedTotal = await page.locator('#shopping tfoot td:nth-child(2)').textContent();
    expect(parseFloat(displayedTotal)).toBe(total);
});

// Approach 2: Using evaluate to do calculations in browser context
test('Shopping List - Browser Evaluate Approach', async ({ page }) => {
    await page.goto('https://letcode.in/table');
    
    // Calculate sum directly in browser context
    const total = await page.evaluate(() => {
        // Select all price cells and convert to array
        const cells = document.querySelectorAll('#shopping tbody tr td:nth-child(2)');
        return Array.from(cells)
            .map(cell => parseFloat(cell.textContent))
            .reduce((sum, price) => sum + price, 0);
    });
    
    // Get displayed total in browser context
    const displayedTotal = await page.evaluate(() => {
        return parseFloat(document.querySelector('#shopping tfoot td:nth-child(2)').textContent);
    });
    
    expect(displayedTotal).toBe(total);
});

/**
 * Test Case 2: Present/Absent Checkbox
 * We'll demonstrate three different approaches to find and click the checkbox
 */

// Approach 1: Using Playwright's modern locator API
test('Present/Absent - Locator Approach', async ({ page }) => {
    await page.goto('https://letcode.in/table');
    
    // Find the row containing 'Raj' using filter
    const rajRow = page.locator('#myTable tbody tr')
        .filter({ hasText: 'Raj' });
    
    // Find and click checkbox within that row
    const checkbox = rajRow.locator('input[type="checkbox"]');
    await checkbox.click();
    
    // Verify checkbox state
    await expect(checkbox).toBeChecked();
});

// Approach 2: Using role selectors for better accessibility
test('Present/Absent - Role Selectors Approach', async ({ page }) => {
    await page.goto('https://letcode.in/table');
    
    // Use built-in table role selectors to find row
    const tableRow = page
        .getByRole('row')
        .filter({ hasText: 'Raj' });
    
    // Click checkbox using role
    await tableRow
        .getByRole('checkbox')
        .click();
    
    await expect(tableRow.getByRole('checkbox')).toBeChecked();
});

/**
 * Test Case 3: Sortable Tables
 * We'll demonstrate three different approaches to verify sorting
 */

// Approach 1: Using basic string comparison
test('Sortable Tables - Basic Comparison', async ({ page }) => {
    await page.goto('https://letcode.in/table');
    
    async function getFirstAndLast(columnLocator) {
        const allValues = await columnLocator.allTextContents();
        return {
            first: allValues[0],
            last: allValues[allValues.length - 1]
        };
    }
    
    // Test Name column sorting
    const nameColumn = page.locator('#advancedtable tbody tr td:nth-child(1)');
    
    // Sort ascending
    await page.getByRole('columnheader', { name: 'Name' }).click();
    const ascValues = await getFirstAndLast(nameColumn);
    
    // Basic string comparison (A comes before Z)
    expect(ascValues.first < ascValues.last).toBeTruthy();
});

// Approach 2: Using localeCompare for proper string comparison
test('Sortable Tables - LocaleCompare Approach', async ({ page }) => {
    await page.goto('https://letcode.in/table');
    
    // Function to get column values
    async function getColumnValues(columnIndex) {
        return await page.locator(`#advancedtable tbody tr td:nth-child(${columnIndex})`)
            .allTextContents();
    }
    
    // Test sorting for Name column
    await page.getByRole('columnheader', { name: 'Name' }).click();
    const ascendingValues = await getColumnValues(1);
    
    // Compare first and last values using localeCompare
    // localeCompare returns:
    // - negative number if first string comes before second
    // - positive number if first string comes after second
    // - zero if strings are equal
    const comparison = ascendingValues[0].localeCompare(ascendingValues[ascendingValues.length - 1]);
    expect(comparison).toBeLessThan(0); // First value should come before last value
    
    // Click again for descending sort
    await page.getByRole('columnheader', { name: 'Name' }).click();
    const descendingValues = await getColumnValues(1);
    
    // In descending order, first value should come after last value
    const descendingComparison = descendingValues[0]
        .localeCompare(descendingValues[descendingValues.length - 1]);
    expect(descendingComparison).toBeGreaterThan(0);
});

// Approach 3: Numeric comparison for age column
test('Sortable Tables - Numeric Comparison', async ({ page }) => {
    await page.goto('https://letcode.in/table');
    
    // Get age column values
    const ageColumn = page.locator('#advancedtable tbody tr td:nth-child(2)');
    
    // Sort ascending
    await page.getByRole('columnheader', { name: 'Age' }).click();
    
    // Get all ages and compare first vs last
    const allAges = await ageColumn.allTextContents();
    const firstAge = parseInt(allAges[0]);
    const lastAge = parseInt(allAges[allAges.length - 1]);
    
    // In ascending order, first age should be less than last age
    expect(firstAge).toBeLessThan(lastAge);
});