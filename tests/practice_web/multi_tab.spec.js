const { test, expect } = require('@playwright/test');

test('handle multiple tabs and verify content', async ({ context }) => {
    // Start with our main page
    const mainPage = await context.newPage();
    
    // Navigate to the initial page
    await mainPage.goto('https://practice.expandtesting.com/windows');
    
    // Store the main page's URL for later reference
    const mainPageUrl = mainPage.url();
    
    // Set up a listener for new pages BEFORE clicking the button
    // This creates a Promise that will resolve when a new page is created
    const pagePromise = context.waitForEvent('page');
    
    // Click the button that opens a new tab
    // Note: Replace this selector with your actual button selector
    await mainPage.getByText('Click Here').click();
    
    // Wait for the new page to be created and get a reference to it
    const newPage = await pagePromise;
    
    try {
        // Verify text content in the new tab
        const textContent = await newPage.locator('.example').textContent();
        expect(textContent).toContain('Example of a new window page for Automation Testing Practice');
        
        // Close the new tab when we're done with it
        await newPage.close();
        
        // The context automatically switches back to the main page
        // Verify we're back on the main page
        expect(mainPage.url()).toBe(mainPageUrl);
        
        await expect(mainPage.locator("//h1[contains(text(),'Opening a new window')]")).toBeVisible();
        
    } catch (error) {
        console.error('Error during tab handling:', error);
        throw error;
    }
});

test('handle multiple tabs opening at once', async ({ context }) => {
    // Start with main page
    const mainPage = await context.newPage();
    await mainPage.goto('http://www.webdriveruniversity.com/');
    
    // Handle contact page opening
    const contactPagePromise = context.waitForEven