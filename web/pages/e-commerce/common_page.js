const { expect } = require('@playwright/test');

class CommonPage {
    constructor(page) {
        this.page = page;
        this.toastPopup = this.page.locator("div[role='alert']");
    }

    async verifyToastPopup(productName, pageName) {
        await expect(this.toastPopup).toBeVisible();
        const toastText = await this.toastPopup.innerText();
        const normalizedText = toastText.replace(/\\s+/g, ' ').trim();
        expect(normalizedText).toContain(`Success: You have added ${productName} to your ${pageName}!`);
        await this.toastPopup.waitFor({ state: 'hidden' });
    }
}

module.exports = CommonPage;