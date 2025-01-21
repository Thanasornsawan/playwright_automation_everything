const BasePage = require('./basePage');

class MyInvoicesPage extends BasePage {
    constructor(page, baseURL) {
        super(page, baseURL);
        this.invoicesTable = this.page.locator('table');
    }

    /**
     * Get all data for a specific invoice from the table
     * @param {string} invoiceNumber - The invoice number to look for
     * @returns {Promise<{invoiceNumber: string, address: string, date: string, total: string}>}
     */
    async getInvoiceData(invoiceNumber) {
        // First wait for table to be populated
        await this.page.waitForSelector('tbody tr td');

        // Use more specific locator to find the row
        const row = this.page.locator('tbody tr', {
            has: this.page.locator(`td:has-text("${invoiceNumber}")`)
        });

        // Verify the row exists
        await row.waitFor({ state: 'visible' });

        // Get all cells from the row
        const cells = row.locator('td');

        // Wait for first cell and verify cells exist
        await cells.first().waitFor({ state: 'visible' });
        const count = await cells.count();
        if (count === 0) {
            throw new Error(`No cells found for invoice ${invoiceNumber}`);
        }

        return {
            invoiceNumber: await cells.nth(0).innerText(),
            address: await cells.nth(1).innerText(),
            date: await cells.nth(2).innerText(),
            total: await cells.nth(3).innerText()
        };
    }

    /**
     * Click the Details button for a specific invoice and wait for navigation
     * @param {string} invoiceNumber - The invoice number to view details for
     * @returns {Promise<void>}
     */
    async viewInvoiceDetails(invoiceNumber) {
        const row = this.page.locator(`//td[contains(text(), "${invoiceNumber}")]/parent::tr`);
        const detailsLink = row.locator('a', { hasText: 'Details' });
        
        // Get the href attribute value
        const href = await detailsLink.getAttribute('href');
        
        // Click the Details link
        await detailsLink.click();
        
        // Wait for navigation using the specific invoice URL
        // Remove the leading slash if present in the href
        const targetPath = href.startsWith('/') ? href.substring(1) : href;
        await this.page.waitForURL(`**/${targetPath}`);
    }
}

module.exports = MyInvoicesPage;