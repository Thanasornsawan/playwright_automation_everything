class BasePage {
    constructor(page, baseURL = 'https://practicesoftwaretesting.com') {
        this.page = page;
        this.baseURL = baseURL;
    }

    async waitForPageLoad() {
        await this.page.waitForLoadState('networkidle');
    }
}

module.exports = BasePage;