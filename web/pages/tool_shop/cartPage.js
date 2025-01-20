const BasePage = require('./basePage');

class CartPage extends BasePage {
    constructor(page, baseURL) {
        super(page, baseURL);
        this.cartTable = this.page.locator('.table.table-hover');
        this.cartUpdateSuccess = this.page.locator('div[role="alert"]', { hasText: 'Product quantity updated.' });
        this.cartDeleteSuccess = this.page.locator('div[role="alert"]', { hasText: 'Product deleted.' });
        this.cartTotal = this.page.locator('[data-test="cart-total"]');
    }

    /**
     * Get all locators related to a specific product in cart
     * @param {string} productName - Name of the product to get locators for
     */
    getProductLocators(productName) {
        // Find the product's row by its name and then locate related elements
        const baseLocator = this.page.locator('span', { hasText: productName })
            .locator('xpath=..')  // parent td
            .locator('xpath=..');  // parent tr

        return {
            // Product quantity input in the same row
            quantity: baseLocator.locator('input[data-test="product-quantity"]'),
            // Product unit price
            unitPrice: baseLocator.locator('span[data-test="product-price"]'),
            // Product total price (quantity × unit price)
            totalPrice: baseLocator.locator('span[data-test="line-price"]'),
            // Delete button for this product
            deleteButton: baseLocator.locator('a.btn.btn-danger svg[data-icon="xmark"]')
        };
    }

    /**
     * Adjust quantity for a specific product
     * @param {string} productName - Name of the product to adjust
     * @param {number} newQuantity - New quantity to set
     */
    async adjustProductQuantity(productName, newQuantity) {
        const locators = this.getProductLocators(productName);
        
        // Wait for quantity input to be interactive
        await locators.quantity.waitFor({ state: 'visible' });
        await locators.quantity.fill(newQuantity.toString());
        await locators.quantity.press('Enter');

        // Wait for update confirmation and price recalculation
        await this.cartUpdateSuccess.first().waitFor({ state: 'visible' });
        await locators.totalPrice.waitFor({ state: 'visible' });
        // Brief wait for any animations to complete
        await this.page.waitForTimeout(500);
    }

    /**
     * Delete a specific product from cart
     * @param {string} productName - Name of the product to delete
     */
    async deleteProduct(productName) {
        const locators = this.getProductLocators(productName);
        await locators.deleteButton.waitFor({ state: 'visible' });
        await locators.deleteButton.click();
        await this.cartDeleteSuccess.waitFor({ state: 'visible' });
        // Wait for the product to be removed
        await this.page.locator(`span[data-test="product-title"]`, {
            hasText: productName,
            exact: true
        }).waitFor({ state: 'hidden' });
        }

    /**
     * Get all price information for a specific product
     * @param {string} productName - Name of the product
     * @returns {Promise<{unitPrice: number, quantity: number, totalPrice: number}>}
     */
    async getProductPriceInfo(productName) {
        const locators = this.getProductLocators(productName);
        
        const unitPriceText = await locators.unitPrice.innerText();
        const quantityText = await locators.quantity.inputValue();
        const totalPriceText = await locators.totalPrice.innerText();

        return {
            unitPrice: parseFloat(unitPriceText.replace('$', '')),
            quantity: parseInt(quantityText),
            totalPrice: parseFloat(totalPriceText.replace('$', ''))
        };
    }

    /**
     * Get the cart total amount
     * @returns {Promise<number>}
     */
    async getCartTotal() {
        const totalText = await this.cartTotal.innerText();
        return parseFloat(totalText.replace('$', ''));
    }
}

module.exports = CartPage;