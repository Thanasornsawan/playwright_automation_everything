const { expect } = require('@playwright/test');

class ProductDetailPage {
    constructor(page) {
        this.page = page;
        this.addToCartButton = this.page.locator("button[title='Add to Cart']:visible");
        this.cartItemTotal = this.page.locator('span.cart-item-total:visible');
        this.favouriteButton = this.page.locator("button[title='Add to Wish List']:visible");
    }

    async addToCart() {
        await this.addToCartButton.click();
    }

    async addToWishList() {
        await this.favouriteButton.click();
    }

    async verifyCartIsEmpty() {
        await expect(this.cartItemTotal).toHaveText('0', { timeout: 5000 });
    }

    async verifyCartItemCount(expectedCount) {
        await expect(this.cartItemTotal).toHaveText(expectedCount);
    }
}

module.exports = ProductDetailPage;