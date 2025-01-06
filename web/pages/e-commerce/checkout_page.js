const { expect } = require('@playwright/test');

class CheckoutPage {
    constructor(page) {
        this.page = page;
        this.removeButton = this.page.locator("//button[@class='btn btn-danger']");
        this.emptyCartMessage = this.page.locator("p:has-text('Your shopping cart is empty!')").first();
    }

    async clearCart() {
        // Check if the cart is not empty by checking for the empty cart message
        const isCartEmpty = await this.emptyCartMessage.isVisible();

        if (!isCartEmpty) {
            await this.removeButton.click();
        } else {
            console.log('Shopping cart is empty, no need to click remove button');
        }
    }
}

module.exports = CheckoutPage;