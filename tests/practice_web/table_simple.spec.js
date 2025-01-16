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
    
    // First, find all rows and get the index of the row containing 'Raj'
    const rows = page.locator('#simpletable tr');
    const count = await rows.count();
    let rajRowIndex = -1;
    
    // Iterate through rows to find 'Raj'
    for (let i = 0; i < count; i++) {
        const rowText = await rows.nth(i).textContent();
        if (rowText.includes('Raj')) {
            rajRowIndex = i;
            break;
        }
    }
    
    // If we found Raj's row, click the checkbox in that row
    if (rajRowIndex !== -1) {
        // Get the checkbox in the Present column of Raj's row
        const checkbox = rows.nth(rajRowIndex).locator('input[type="checkbox"]');
        await checkbox.click();
        
        // Verify the checkbox is checked
        await expect(checkbox).toBeChecked();
    } else {
        throw new Error("Could not find row containing 'Raj'");
    }
});

// Approach 2: Using role selectors for better accessibility
test('Present/Absent - Role Selectors Approach', async ({ page }) => {
    await page.goto('https://letcode.in/table');
    
    // Use built-in table role selectors to find row
    const tableRow = page
        .getByRole('row')
        .filter({ hasText: 'Raj' });
    
    // Click checkbox using role
    const checkbox = tableRow
    .locator('td:nth-child(4)') // Assuming Present/Absent is the 4th column
    .getByRole('checkbox');

    await checkbox.click();
    await expect(checkbox).toBeChecked();
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
    const dessertHeaderColumn = page.locator('//label[contains(text(), "Sortable")]/following::table[1]//th[1]');
    
    // Sort ascending
    await dessertHeaderColumn.click();
    const dessertColumn = page.locator('//label[contains(text(), "Sortable")]/following::table[1]//td[1]');
    const ascValues = await getFirstAndLast(dessertColumn);
    console.log(ascValues);
    
    // Basic string comparison (A comes before Z)
    expect(ascValues.first < ascValues.last).toBeTruthy();
});

// Approach 2: Using localeCompare for proper string comparison
test('Sortable Tables - LocaleCompare Approach with XPath', async ({ page }) => {
    await page.goto('https://letcode.in/table');
    
    // This function now takes a column number and returns all values from that column
    // We use XPath to find the table relative to the "Sortable" label
    async function getColumnValues(columnNumber) {
        // Using XPath to get all cells in the specified column
        const columnCells = page.locator(`//label[contains(text(), "Sortable")]/following::table[1]//td[${columnNumber}]`);
        return await columnCells.allTextContents();
    }

    // Function to get and click a column header by its position
    async function clickColumnHeader(columnNumber) {
        const headerLocator = page.locator(`//label[contains(text(), "Sortable")]/following::table[1]//th[${columnNumber}]`);
        await headerLocator.click();
        // Add a small wait to allow sorting to complete
        await page.waitForTimeout(1000);
    }

    // Test sorting for Dessert column (first column)
    console.log('Testing Dessert column sorting...');
    
    // Compare first and last values using localeCompare
    // localeCompare returns:
    // - negative number if first string comes before second
    // - positive number if first string comes after second
    // - zero if strings are equal

    // Click for ascending sort
    await clickColumnHeader(1);
    const ascendingValues = await getColumnValues(1);
    console.log('Ascending values:', ascendingValues);
    
    // Compare first and last values using localeCompare
    const comparison = ascendingValues[0]
        .toLowerCase()
        .localeCompare(ascendingValues[ascendingValues.length - 1].toLowerCase());
    expect(comparison).toBeLessThan(0);
    console.log('Ascending sort verified');
    
    // Click for descending sort
    await clickColumnHeader(1);
    const descendingValues = await getColumnValues(1);
    console.log('Descending values:', descendingValues);
    
    const descendingComparison = descendingValues[0]
        .toLowerCase()
        .localeCompare(descendingValues[descendingValues.length - 1].toLowerCase());
    expect(descendingComparison).toBeGreaterThan(0);
    console.log('Descending sort verified');

    // Test sorting for Calories column (second column)
    console.log('Testing Calories column sorting...');
    
    // Click for ascending sort
    await clickColumnHeader(2);
    const caloriesAsc = await getColumnValues(2);
    
    // For calories, we need to compare numbers, not strings
    const firstCalorieAsc = parseInt(caloriesAsc[0]);
    const lastCalorieAsc = parseInt(caloriesAsc[caloriesAsc.length - 1]);
    expect(firstCalorieAsc).toBeLessThan(lastCalorieAsc);
    console.log('Calories ascending sort verified');
    
    // Click for descending sort
    await clickColumnHeader(2);
    const caloriesDesc = await getColumnValues(2);
    
    const firstCalorieDesc = parseInt(caloriesDesc[0]);
    const lastCalorieDesc = parseInt(caloriesDesc[caloriesDesc.length - 1]);
    expect(firstCalorieDesc).toBeGreaterThan(lastCalorieDesc);
    console.log('Calories descending sort verified');
});

// Approach 3: Numeric comparison for age column
test('Sortable Tables - Numeric Comparison', async ({ page }) => {
    await page.goto('https://letcode.in/table');
    
    // Get age column values
    const caloriesColumnHeader = page.locator('//label[contains(text(), "Sortable")]/following::table[1]//th[2]');
    
    // Sort ascending
    caloriesColumnHeader.click();
    const caloriesColumn = page.locator('//label[contains(text(), "Sortable")]/following::table[1]//td[2]');
    // Get all ages and compare first vs last
    const allCalories = await caloriesColumn.allTextContents();
    const firstCalories = parseInt(allCalories[0]);
    const lastCalories = parseInt(allCalories[allCalories.length - 1]);
    
    // In ascending order, first age should be less than last age
    expect(firstCalories).toBeLessThan(lastCalories);
});