const BasePage = require('./basePage');

class ProductDetailPage extends BasePage {
    constructor(page, baseURL) {
        super(page, baseURL);
        this.quantityPlus = this.page.locator('[data-test="increase-quantity"]');
        this.quantityMinus = this.page.locator('[data-test="decrease-quantity"]');
        this.quantityInput = this.page.locator('[data-test="quantity"]');
        this.addToCartButton = this.page.locator('[data-test="add-to-cart"]');
        this.cartIcon = this.page.locator('[data-test="nav-cart"]');
        this.cartQuantity = this.page.locator('[data-test="cart-quantity"]')
        this.outOfStockLabel = this.page.locator('text=Out of stock');
        this.brandLabel = this.page.locator('[aria-label="brand"]');
        this.productName = this.page.locator('[data-test="product-name"]');
        this.productPrice = this.page.locator('[data-test="unit-price"]');
        this.addToCartSuccess = this.page.locator('div[role="alert"]', { hasText: 'Product added to shopping cart.' });
        this.favoriteNotAuthorized = this.page.locator('div[role="alert"]', { hasText: 'Unauthorized, can not add product to your favorite list.' });
        this.favouriteDupplicated = this.page.locator('div[role="alert"]', { hasText: 'Product already in your favorites list.' });
        this.favouriteSuccess = this.page.locator('div[role="alert"]', { hasText: 'Product added to your favorites list.' });
    }

    // Get the current quantity value from the input field
    async getCurrentQuantity() {
        await this.quantityInput.waitFor({ state: 'visible' });
        const value = await this.quantityInput.inputValue();
        return parseInt(value);
    }

    // Increase quantity by clicking the plus button a specified number of times
    async increaseQuantity(times) {
        await this.quantityPlus.waitFor({ state: 'visible' });
        for (let i = 0; i < times; i++) {
            await this.quantityPlus.click();
            // Wait for the quantity input to update after each click
            await this.page.waitForTimeout(100); // Brief wait for input update
        }
        return await this.getCurrentQuantity();
    }

    async addToCart() {
        // Wait for the button to be visible and clickable
        await this.addToCartButton.waitFor({ state: 'visible' });
        await this.addToCartButton.click();
        
        // Wait for success message to appear and disappear
        await this.addToCartSuccess.waitFor({ state: 'visible' });
        await this.addToCartSuccess.waitFor({ state: 'hidden' });
    }

    async goToCart() {
        // Wait for cart icon to be visible and clickable
        await this.cartIcon.waitFor({ state: 'visible' });
        await this.cartIcon.click();
        
        // Wait for navigation to complete and cart page to load
        await this.page.waitForURL('**/checkout');
    }
}

module.exports = ProductDetailPage;