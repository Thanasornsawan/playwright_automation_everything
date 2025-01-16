/**
 * TableHelper class provides utilities for interacting with and testing advanced tables
 * It encapsulates common table operations and verifications
 */
class TableHelper {
    constructor(page) {
        this.page = page;
        this.table = page.locator('#advancedtable');
    }

    /**
     * Navigate to the advanced table page
     */
    async navigateToTable() {
        await this.page.goto('https://letcode.in/advancedtable');
    }

    /**
     * Get all rows in the table
     * @returns {Locator} Playwright locator for table rows
     */
    async getRows() {
        return this.table.locator('tbody tr');
    }

    /**
     * Get the current number of rows in the table
     * @returns {Promise<number>} Number of rows
     */
    async getRowCount() {
        const rows = await this.getRows();
        return rows.count();
    }

    /**
     * Set the number of entries to display per page
     * @param {string} value - Number of entries to show ('5', '10', etc.)
     */
    async setEntriesPerPage(value) {
        await this.page.getByRole('combobox', { name: 'entries' }).selectOption(value);
        // Wait for table to update
        await this.page.waitForTimeout(500);
    }

    /**
     * Search for text and verify its presence in university name or website
     * @param {string} searchText - Text to search for
     * @returns {Promise<number>} Number of matching rows found
     */
    async searchAndVerifyText(searchText) {
        // Enter search text
        await this.page.locator('#advancedtable_filter input').fill(searchText);
        await this.page.waitForTimeout(500); // Wait for table update

        // Get all rows
        const rows = await this.getRows();
        const rowCount = await rows.count();

        // For each row, verify search text exists in either column
        for (let i = 0; i < rowCount; i++) {
            const universityName = await rows.nth(i).locator('td').nth(1).textContent();
            const website = await rows.nth(i).locator('td').nth(3).textContent();
            
            const found = universityName.toLowerCase().includes(searchText.toLowerCase()) ||
                         website.toLowerCase().includes(searchText.toLowerCase());
            
            if (!found) {
                throw new Error(
                    `Row ${i + 1} does not contain "${searchText}" in either university name or website.\n` +
                    `University: ${universityName}\n` +
                    `Website: ${website}`
                );
            }
        }

        return rowCount;
    }

    /**
     * Get the current page info text
     * @returns {Promise<string>} Info text showing current entries range
     */
    async getInfoText() {
        return this.page.locator('#advancedtable_info').textContent();
    }

    /**
     * Calculate and verify the pagination text based on current state
     * @param {number} entriesPerPage - Number of entries per page
     * @param {number} currentPage - Current page number
     * @param {number} totalEntries - Total number of entries in table
     * @returns {Promise<void>}
     */
    async verifyPaginationText(entriesPerPage, currentPage, totalEntries = 10) {
        const start = (currentPage - 1) * entriesPerPage + 1;
        const end = Math.min(currentPage * entriesPerPage, totalEntries);
        
        // Create the parts we want to verify
        const expectedParts = [
            `Showing ${start}`,           // Start number
            `to ${end}`,                  // End number
            'entries'                     // Static text
        ];
        
        const actualText = await this.getInfoText();
        
        // Check if each part exists in the actual text
        const missingParts = expectedParts.filter(part => !actualText.includes(part));
        
        if (missingParts.length > 0) {
            throw new Error(
                `Pagination text mismatch.\n` +
                `Expected parts: ${expectedParts.join(', ')}\n` +
                `Missing parts: ${missingParts.join(', ')}\n` +
                `Actual text: ${actualText}`
            );
        }
    }

    /**
     * Navigate to the next page
     * @returns {Promise<void>}
     */
    async goToNextPage() {
        await this.page.locator('#advancedtable_next').click();
        await this.page.waitForTimeout(500); // Wait for table update
    }
}

module.exports = { TableHelper };