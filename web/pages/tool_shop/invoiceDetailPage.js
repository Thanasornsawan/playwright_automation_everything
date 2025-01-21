const BasePage = require('./basePage');

class InvoicePage extends BasePage {
    constructor(page, baseURL) {
        super(page, baseURL);
        this.invoiceNumber = this.page.locator('[data-test="invoice-number"]');
        this.invoiceDate = this.page.locator('[data-test="invoice-date"]');
        this.paymentMethod = this.page.locator('[data-test="payment-method"]');
        this.downloadPdfButton = this.page.locator('[data-test="download-invoice"]');
        this.productTable = this.page.locator('.table');
    }

    /**
     * Get all invoice details from the input fields
     * @returns {Promise<{invoiceNumber: string, date: string, paymentMethod: string}>}
     */
    async getInvoiceDetails() {
        return {
            invoiceNumber: await this.invoiceNumber.inputValue(),
            date: await this.invoiceDate.inputValue(),
            paymentMethod: await this.paymentMethod.inputValue()
        };
    }

    /**
     * Get details for a specific product from the invoice
     * @param {string} productName - Name of the product to get details for
     * @returns {Promise<Object>}
     */
    async getProductDetails(productName) {
        const row = this.productTable.locator('tr', { has: this.page.locator(`text=${productName}`) });
        const cells = await row.locator('td').all();
        
        return {
            quantity: parseInt(await cells[0].innerText()),
            name: await cells[1].innerText(),
            unitPrice: parseFloat((await cells[2].innerText()).replace('$', '')),
            totalPrice: parseFloat((await cells[3].innerText()).replace('$', ''))
        };
    }

    /**
     * Wait for download button to be enabled with retry logic
     * @param {number} maxAttempts - Maximum number of attempts (default 3)
     * @param {number} timeout - Timeout per attempt in ms (default 20000)
     */
    async waitForDownloadButtonEnabled(maxAttempts = 3, timeout = 20000) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                //console.log(`Attempt ${attempt}: Checking download button state`);
                const isDisabled = await this.downloadPdfButton.isDisabled();
                
                if (!isDisabled) {
                    //console.log('Button is enabled');
                    // Add a small wait after button becomes enabled
                    await this.page.waitForTimeout(1000);
                    return true;
                }

                //console.log('Button is disabled, waiting...');
                await this.downloadPdfButton.waitFor({ 
                    state: 'visible',
                    enabled: true,
                    timeout: timeout
                });
                
                //console.log('Button became enabled');
                // Add a small wait after button becomes enabled
                await this.page.waitForTimeout(1000);
                return true;
            } catch (error) {
                console.log(`Attempt ${attempt}: Button still disabled`);
                
                if (attempt === maxAttempts) {
                    throw new Error(`Download button remained disabled after ${maxAttempts} attempts`);
                }

                // Add short delay between attempts
                await this.page.waitForTimeout(2000);

                // Refresh and wait for page to load
                console.log('Refreshing page...');
                await this.page.reload();
                await this.page.waitForLoadState('networkidle');
            }
        }
    }

    /**
     * Try to download PDF with retries
     * @param {number} maxAttempts - Maximum number of download attempts
     * @param {number} timeout - Timeout for each attempt
     */
    async tryDownload(maxAttempts = 3, timeout = 60000) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                //console.log(`Download attempt ${attempt}`);
                
                // Set up download promise before clicking
                const downloadPromise = this.page.waitForEvent('download', { timeout });
                
                // Click and wait a bit
                await this.downloadPdfButton.click();
                await this.page.waitForTimeout(1000);

                const download = await downloadPromise;
                //console.log('Download succeeded');
                return download;
            } catch (error) {
                console.error(`Download attempt ${attempt} failed:`, error.message);
                
                if (attempt === maxAttempts) {
                    throw error;
                }
                
                // Wait before retry
                await this.page.waitForTimeout(2000);
                
                // Refresh the page for next attempt
                await this.page.reload();
                await this.page.waitForLoadState('networkidle');
                
                // Wait for button to be enabled again
                await this.waitForDownloadButtonEnabled();
            }
        }
    }
    
    /**
     * Download the invoice PDF with retries
     */
    async downloadPDF(timeout = 60000) {
        try {
            // First wait for button to be enabled
            await this.waitForDownloadButtonEnabled(3, 15000);
            
            // Try to download with retries
            const download = await this.tryDownload(3, timeout);
            return download;
        } catch (error) {
            console.error('Download failed:', error.message);
            throw new Error(`Failed to download PDF: ${error.message}`);
        }
    }
}

module.exports = InvoicePage;