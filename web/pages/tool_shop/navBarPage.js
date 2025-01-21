const BasePage = require('./basePage');

class NavBarPage extends BasePage {
    constructor(page, baseURL) {
        super(page, baseURL);
        this.accountMenu = this.page.locator('[data-test="nav-menu"]');
        this.myInvoicesLink = this.page.locator('[data-test="nav-my-invoices"]');
        this.cartIcon = this.page.locator('[data-test="nav-cart"]');
    }

    /**
     * Navigate to My Invoices page through the account menu
     * @returns {Promise<void>}
     */
    async goToMyInvoices() {
        await this.accountMenu.click();
        await this.myInvoicesLink.click();
        await this.page.waitForURL('**/invoices');
    }

    /**
     * Navigate to cart page
     * @returns {Promise<void>}
     */
    async goToCart() {
        await this.cartIcon.click();
        await this.page.waitForURL('**/checkout');
    }

    /**
     * Get the displayed user name from the account menu
     * @returns {Promise<string>}
     */
    async getUserName() {
        const displayName = await this.accountMenu.innerText();
        return displayName.trim();
    }
}

module.exports = NavBarPage;