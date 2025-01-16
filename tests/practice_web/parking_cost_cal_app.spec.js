const { test, expect } = require('@playwright/test');
const { formatDateTime, createStartDate, createEndDate, calculateExpectedCost } = require('../../utils/parkingUtils');
const parkingData = require('../../data/web_practice/parking_data.json');

// Enable parallel execution
test.describe.configure({ mode: 'parallel' });

test.describe('Parking Cost Calculator', () => {
    // Each test needs to handle its own context creation
    for (const testCase of parkingData.testCases) {
        test(testCase.name, async ({ browser }) => {
            // Create context and page for this specific test
            const context = await browser.newContext();
            const page = await context.newPage();
            
        try {
            // Navigate to the page
            await page.goto('https://practice.expandtesting.com/webpark');
            console.log('Navigated to parking calculator page');

            // Ensure the parking lot selector is loaded and visible
            await page.waitForSelector('select#parkingLot', { 
                state: 'visible',
                timeout: 10000 
            });

            // Select parking type and verify selection
            await page.selectOption('select#parkingLot', testCase.type);
            //const selectedValue = await page.$eval('select#parkingLot', el => el.value);
            const selectedValue = await page.locator('select#parkingLot').getAttribute('value');
            console.log(`Selected parking type: ${selectedValue}`);

            // Create and set entry date/time
            const entryDate = createStartDate();
            const { dateStr: entryDateStr, timeStr: entryTimeStr } = formatDateTime(entryDate);

            await page.fill('#entryDate', entryDateStr);
            await page.fill('#entryTime', entryTimeStr);
            console.log(`Set entry date: ${entryDateStr} ${entryTimeStr}`);

            // Create and set exit date/time
            const exitDate = createEndDate(entryDate, testCase.hours);
            const { dateStr: exitDateStr, timeStr: exitTimeStr } = formatDateTime(exitDate);

            await page.fill('#exitDate', exitDateStr);
            await page.fill('#exitTime', exitTimeStr);
            console.log(`Set exit date: ${exitDateStr} ${exitTimeStr}`);

            // Click calculate and wait for result
            await page.click('button:has-text("Calculate")');
            
            // Wait for cost element with longer timeout
            const parkingCostElement = await page.waitForSelector('#resultValue', {
                state: 'visible',
                timeout: 10000
            });

            // Get actual and expected costs
            const actualCost = await parkingCostElement.textContent();
            const expectedCost = calculateExpectedCost(testCase.type, entryDate, exitDate);

            console.log(`Expected cost: €${expectedCost}`);
            console.log(`Actual cost: ${actualCost}`);

            // Verify the cost
            expect(parseFloat(actualCost.replace('€', ''))).toBe(expectedCost);

        } finally {
            // Clean up resources for this test
            await context.close();
        }
    });
   }

    // Test invalid dates case
    test('Invalid dates should show error message', async ({ browser }) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        try {
            await page.goto('https://practice.expandtesting.com/webpark');
            console.log('\nStarting invalid dates test case');

            await page.waitForSelector('select#parkingLot', { state: 'visible' });
            await page.selectOption('select#parkingLot', 'Valet Parking');

            const entryDate = createStartDate();
            const exitDate = new Date(entryDate.getTime() - (24 * 60 * 60 * 1000));

            const { dateStr: entryDateStr, timeStr: entryTimeStr } = formatDateTime(entryDate);
            const { dateStr: exitDateStr, timeStr: exitTimeStr } = formatDateTime(exitDate);

            await page.fill('#entryDate', entryDateStr);
            await page.fill('#entryTime', entryTimeStr);
            await page.fill('#exitDate', exitDateStr);
            await page.fill('#exitTime', exitTimeStr);

            await page.click('button:has-text("Calculate")');

            console.log('entry date', entryDateStr);
            console.log('entry time', entryTimeStr);
            console.log('exit date', exitDateStr);
            console.log('exit time', exitTimeStr);
            // Wait for and verify error message
            await page.waitForSelector('#resultMessage', { state: 'visible' });
            const errorMessage = await page.locator('#resultMessage').textContent()
            expect(errorMessage).toBe('Invalid exit date format!');

        } finally {
            await context.close();
            console.log('Closed test page');
        }
    });
});