const BasePage = require('./basePage');

class CartPage extends BasePage {
    constructor(page, baseURL) {
        super(page, baseURL);
        this.cartTable = this.page.locator('.table.table-hover');
        this.cartUpdateSuccess = this.page.locator('div[role="alert"]', { hasText: 'Product quantity updated.' });
        this.cartDeleteSuccess = this.page.locator('div[role="alert"]', { hasText: 'Product deleted.' });
        this.cartTotal = this.page.locator('[data-test="cart-total"]');
        this.proceedToCheckoutButton1 = this.page.locator('[data-test="proceed-1"]'); //at step cart
        this.proceedToCheckoutButton2 = this.page.locator('[data-test="proceed-2"]'); //at step sign in
        this.proceedToCheckoutButton3 = this.page.locator('[data-test="proceed-3"]'); //at step billing address
        this.paymentMethodDropdown = this.page.locator('[data-test="payment-method"]');
        this.confirmPaymentButton = this.page.locator('[data-test="finish"]');
        this.orderConfirmation = this.page.locator('#order-confirmation');
        this.paymentSuccess = this.page.locator('text="Payment was successful"');

        // Payment method mapping
        this.paymentOptions = {
            'Bank Transfer': 'bank-transfer',
            'Cash on Delivery': 'cash-on-delivery',
            'Credit Card': 'credit-card',
            'Buy Now Pay Later': 'buy-now-pay-later',
            'Gift Card': 'gift-card'
        };
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
        await locators.deleteButton.waitFor({ state: 'visible', timeout: 10000 });
        await locators.deleteButton.click();
        try {
            await this.cartDeleteSuccess.waitFor({ 
                state: 'visible',
                timeout: 10000 
            });
        } catch (error) {
            console.log('Delete success message not shown, verifying product removal');
        }

        // Wait for product to be removed from DOM
        await this.page.waitForSelector(`span[data-test="product-title"]:has-text("${productName}")`, {
            state: 'detached',
            timeout: 10000
        });

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

    /**
     * Process checkout with specified payment method
     * @param {string} paymentMethod - The payment method text (e.g., 'Cash on Delivery')
     * @throws {Error} If payment method is not supported
     */
    async processToCompleteCheckoutPayment(paymentMethod) {
        // Validate payment method
        const paymentValue = this.paymentOptions[paymentMethod];
        if (!paymentValue) {
            const validOptions = Object.keys(this.paymentOptions).join(', ');
            throw new Error(`Invalid payment method: ${paymentMethod}. Valid options are: ${validOptions}`);
        }

        // Process checkout steps
        await this.proceedToCheckoutButton1.click();
        await this.proceedToCheckoutButton2.click();
        await this.proceedToCheckoutButton3.click();

        // Select payment method
        await this.paymentMethodDropdown.selectOption(paymentValue);

        // Confirm payment
        await this.confirmPaymentButton.click();
        await this.paymentSuccess.waitFor({ state: 'visible' });
        await this.confirmPaymentButton.click();
    }

    /**
     * Get invoice number from order confirmation message
     * @returns {Promise<string>}
     */
    async getInvoiceNumberFromConfirmation() {
        await this.orderConfirmation.waitFor({ state: 'visible' });
        const confirmationText = await this.orderConfirmation.innerText();
        const match = confirmationText.match(/INV-\d+/);
        return match ? match[0] : null;
    }

}

module.exports = CartPage;