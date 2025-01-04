const { expect } = require('@playwright/test');

class ProductDetailPage {
    constructor(page) {
        this.page = page;
        this.addToCartButton = this.page.locator("button[title='Add to Cart']").nth(1);
        this.toastPopup = this.page.locator("div[role='alert']");
        this.cartItemTotal = this.page.locator('span.cart-item-total').nth(1);
    }

    async addToCart() {
        await this.addToCartButton.click();
    }

    async verifyToastPopup(productName) {
        await expect(this.toastPopup).toBeVisible();
        const toastText = await this.toastPopup.innerText();
        const normalizedText = toastText.replace(/\\s+/g, ' ').trim();
        expect(normalizedText).toContain(`Success: You have added ${productName} to your shopping cart!`);
        await this.toastPopup.waitFor({ state: 'hidden' });
    }

    async verifyCartItemCount(expectedCount) {
        await expect(this.cartItemTotal).toHaveText(expectedCount);
    }
}

module.exports = ProductDetailPage;