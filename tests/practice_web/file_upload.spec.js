const { test, expect } = require('@playwright/test');
const path = require('path');

test('upload image file successfully', async ({ page }) => {
    const testImagePath = path.join(__dirname, '../../data/images/small_image.jpg');
    
    try {
        // Navigate to the upload page
        await page.goto('http://www.webdriveruniversity.com/File-Upload/index.html');
        
        // Handle file selection
        const [fileChooser] = await Promise.all([
            page.waitForEvent('filechooser'),
            page.click('#myFile')
        ]);
        
        // Set our file using the resolved path
        await fileChooser.setFiles(testImagePath);
        
        // Verify file selection
        const inputValue = await page.locator('#myFile').inputValue();
        //console.log('Selected file:', inputValue);
        expect(inputValue).toContain('small_image.jpg');
        
        // Handle the upload confirmation dialog
        page.once('dialog', async dialog => {
            //console.log('Upload dialog message:', dialog.message());
            expect(dialog.message()).toContain('Your file has now been uploaded!');
            await dialog.accept();
        });
        
        // Submit the upload
        await page.click('#submit-button');
        await page.waitForLoadState('networkidle');
        
    } catch (error) {
        console.error('File upload failed:', {
            error: error.message,
            path: testImagePath,
            exists: require('fs').existsSync(testImagePath)
        });
        
        await page.screenshot({
            path: `upload-error-${Date.now()}.png`,
            fullPage: true
        });
        
        throw error;
    }
});