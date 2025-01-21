const BasePage = require('./basePage');

class LoginPage extends BasePage {
    constructor(page, baseURL) {
        super(page, baseURL);
        this.emailInput = this.page.locator('[data-test="email"]');
        this.passwordInput = this.page.locator('[data-test="password"]');
        this.loginButton = this.page.locator('[data-test="login-submit"]');
    }

    /**
     * Login with the provided credentials
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<void>}
     */
    async login(email, password) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
        await this.page.waitForURL('**/account'); // Wait for navigation to complete
    }
}

module.exports = LoginPage;