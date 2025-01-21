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
        this.categorylabel = this.page.locator('[aria-label="category"]');
        this.productName = this.page.locator('[data-test="product-name"]');
        this.productPrice = this.page.locator('[data-test="unit-price"]');
        this.addToCartSuccess = this.page.locator('div[role="alert"]', { hasText: 'Product added to shopping cart.' });
        this.favoriteNotAuthorized = this.page.locator('div[role="alert"]', { hasText: 'Unauthorized, can not add product to your favorite list.' });
        this.favouriteDupplicated = this.page.locator('div[role="alert"]', { hasText: 'Product already in your favorites list.' });
        this.favouriteSuccess = this.page.locator('div[role="alert"]', { hasText: 'Product added to your favorites list.' });
        this.relatedProductcardTitle = this.page.locator('.card-title');
        this.relatedProductSection = this.page.locator('text=Related products');
    }

    /**
     * Get category of current product
     * @returns {Promise<string>} Category name
     */
    async getCategory() {
        await this.categorylabel.waitFor({ state: 'visible' });
        return await this.categorylabel.innerText();
    }

    /**
     * Get all related product names
     * @returns {Promise<string[]>} Array of related product names
     */
    async getRelatedProductNames() {
        await this.relatedProductcardTitle.first().waitFor({ state: 'visible' });
        return await this.relatedProductcardTitle.allInnerTexts();
    }

    /**
     * Open a related product in new tab
     * @param {number} index Index of the related product to open
     * @returns {Promise<Page>} New page object
     */
    async openRelatedProductInNewTab(index) {
        await this.relatedProductSection.scrollIntoViewIfNeeded();
        await this.relatedProductcardTitle.nth(index).waitFor({ state: 'visible' });
        const productCard = this.relatedProductcardTitle.nth(index);
        await productCard.waitFor({ state: 'visible' });
        
        // Create new page promise before clicking
        const pagePromise = this.page.context().waitForEvent('page');
        
        // Click with modifier to open in new tab
        await productCard.click({ modifiers: ['Meta'] });
        
        const newPage = await pagePromise;
        await newPage.waitForLoadState('networkidle');
        
        return newPage;
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