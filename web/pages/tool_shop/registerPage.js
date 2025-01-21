const BasePage = require('./basePage');

class RegisterPage extends BasePage {
    constructor(page, baseURL) {
        super(page, baseURL);
        this.firstNameInput = this.page.locator('[data-test="first-name"]');
        this.lastNameInput = this.page.locator('[data-test="last-name"]');
        this.dateOfBirthInput = this.page.locator('[data-test="dob"]');
        this.emailInput = this.page.locator('[data-test="email"]');
        this.passwordInput = this.page.locator('[data-test="password"]');
        this.addressInput = this.page.locator('[data-test="address"]');
        this.cityInput = this.page.locator('[data-test="city"]');
        this.stateInput = this.page.locator('[data-test="state"]');
        this.postalCodeInput = this.page.locator('[data-test="postcode"]');
        this.countrySelect = this.page.locator('[data-test="country"]');
        this.phoneInput = this.page.locator('[data-test="phone"]');
        this.submitButton = this.page.locator('[data-test="register-submit"]');
    }

    /**
     * Format date to YYYY-MM-DD format required by the HTML date input
     * Even though the display might show as DD/MM/YYYY, the input needs YYYY-MM-DD
     * @param {Date} date - Date object to format
     * @returns {string} Formatted date string
     */
    formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Register a new user with the provided details
     * @param {Object} userData - User registration data
     * @returns {Promise<void>}
     */
    async registerUser(userData) {
        await this.page.goto(`${this.baseURL}/auth/register`);
        await this.firstNameInput.fill(userData.firstName);
        await this.lastNameInput.fill(userData.lastName);
        if (userData.dateOfBirth) {
            const formattedDate = this.formatDateForInput(userData.dateOfBirth);
            await this.dateOfBirthInput.fill(formattedDate);
            await this.dateOfBirthInput.press('Tab');
        }
        await this.emailInput.fill(userData.email);
        await this.passwordInput.fill(userData.password);
        await this.addressInput.fill(userData.address);
        await this.cityInput.fill(userData.city);
        await this.stateInput.fill(userData.state);
        await this.postalCodeInput.fill(userData.postalCode);
        await this.countrySelect.selectOption(userData.country);
        await this.phoneInput.fill(userData.phone);
        await this.submitButton.click();
        await this.page.waitForURL('**/auth/login'); // Wait for navigation after registration
    }
}

module.exports = RegisterPage;