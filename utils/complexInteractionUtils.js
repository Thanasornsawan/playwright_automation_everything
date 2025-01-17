const path = require('path');
const { expect } = require('@playwright/test');

class ComplexInteractionHelper {
    constructor(page, testInfo) {
        this.page = page;
        this.testInfo = testInfo;
        this.screenshotIndex = 0;
    }

    /**
     * Takes a screenshot and attaches it to the test report
     * @param {string} name - Description of the screenshot
     */
    async takeScreenshot(name) {
        this.screenshotIndex++;
        // Create a clean filename from the screenshot name
        const cleanName = name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        
        // Construct the screenshot filename using the test title
        const testTitle = this.testInfo.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        const screenshotName = `${testTitle}-${this.screenshotIndex}-${cleanName}.png`;
        
        // Create the full path for the screenshot
        const screenshotPath = path.join(this.testInfo.outputDir, screenshotName);

        // Take the screenshot
        await this.page.screenshot({
            path: screenshotPath,
            fullPage: true
        });

        // Attach the screenshot to the test report
        await this.testInfo.attach(`Step ${this.screenshotIndex}: ${name}`, {
            path: screenshotPath,
            contentType: 'image/png'
        });
    }

    /**
     * Navigate through a complex nested dropdown menu with hover interactions
     * Real example using: https://smartmenus.org/demo/bootstrap-4/
     */
    async navigateNestedDropdown() {
        // Navigate to the demo page and wait for it to load fully
        await this.page.goto('https://smartmenus.org/demo/bootstrap-4/');
        await this.page.waitForLoadState('networkidle');
        await this.takeScreenshot('initial page load');

        // Find and hover over the About link to open its dropdown
        const aboutMenu = this.page.locator('a.has-submenu:has-text("About")');
        await aboutMenu.click();
        await this.page.waitForTimeout(1000); // Wait for submenu animation
        await this.takeScreenshot('About menu opened');

        // Wait for the submenu to be visible
        const companyMenu = this.page.locator('a.has-submenu:has-text("The company")');
        await companyMenu.waitFor({ state: 'visible' });
        await companyMenu.click();

        // Wait for its submenu to be visible
        const workLink = this.page.locator('span:has-text("Work")')
        await workLink.waitFor({ state: 'visible' });
        await this.takeScreenshot('Company submenu opened');
        await workLink.click();
        await this.takeScreenshot('Work link clicked');
        await this.page.waitForLoadState('networkidle');

        // Verify the navigation
        await Promise.all([
            expect(this.page).toHaveURL('https://vadikom.com/work/'),
            this.page.waitForLoadState('domcontentloaded'),
            this.page.locator('main').waitFor({ state: 'visible' })
        ]);

        // Add a small buffer to ensure animations complete
        await this.page.waitForTimeout(500);
    }

    /**
     * Fill a dynamic form with searchable dropdown
     * Real example using: https://select2.org/getting-started/basic-usage
     */
    async fillDynamicSearchableForm() {
        // Navigate to Select2 demo
        await this.page.goto('https://select2.org/getting-started/basic-usage');
        await this.takeScreenshot('initial form state');
        
        // Find and click the select element
        const selectContainer = this.page
            .locator('.select2-container')
            .first();
        
        await selectContainer.click();
        await this.takeScreenshot('dropdown opened');

        // Type in the search box
        await this.page
            .locator('.select2-search__field').first()
            .fill('Alaska');
        await this.takeScreenshot('search text entered');

        // Select the option
        await this.page
            .locator('.select2-results__option li')
            .filter({ hasText: 'Alaska' }).first()
            .click();
        await this.takeScreenshot('option selected');

        // Verify selection
        const selectedText = await selectContainer.textContent();
        return selectedText.includes('Alaska');
    }

    /**
     * Handle multi-select dropdown interactions
     * Real example using: https://semantic-ui.com/modules/dropdown.html
     */
    async handleMultiSelect() {
        // Navigate to Semantic UI dropdown demo
        await this.page.goto('https://semantic-ui.com/modules/dropdown.html');
        await this.takeScreenshot('initial multiselect state');

        // Find the specific Skills dropdown by combining class and content matching
        const dropdown = this.page
        .locator('.ui.fluid.dropdown.multiple')
        .filter({ hasText: 'Skills' })
        .first();

        // Wait for it to be ready and visible
        await dropdown.waitFor({ state: 'visible' });

        await dropdown.click();
        await this.takeScreenshot('dropdown opened');

        // Select multiple skills
        const skillsToSelect = ['Angular', 'CSS', 'HTML'];
        
        for (const skill of skillsToSelect) {
            await this.page
                .locator('.menu > .item')
                .filter({ hasText: skill })
                .first()
                .click();
        }

        // Verify selections
        const selectedSkills = await dropdown
            .locator('.label')
            .allTextContents();
        await this.takeScreenshot('skill selected');
        return selectedSkills;
    }

     /**
     * Generates a random string of specified length
     * @param {number} length - Length of the string to generate
     * @returns {string} Random string
     */
     generateRandomString(length = 8) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    /**
     * Fill the DemoQA practice form with test data
     * The function uses ID selectors for reliable element selection
     * Returns the test data for verification
     * 
     * Use force: true when:
        Working with custom-styled form elements (radio buttons, checkboxes)
        Clicking elements that might be temporarily covered by animations
        Interacting with elements that are technically in the DOM but visually hidden

    Use exact: true when:
        Selecting from a list of similar options (like cities or states)
        Working with dropdown menus where partial matches could cause problems
        Any time you need to ensure you're getting precisely the text you want, not just something that contains it
     */
    async fillDynamicConditionalForm() {
        // Navigate to DemoQA practice form
        await this.page.goto('https://demoqa.com/automation-practice-form');
        await this.takeScreenshot('initial form state');

        // Generate random test data
        const testData = {
            firstName: this.generateRandomString(),
            lastName: this.generateRandomString(),
            email: `${this.generateRandomString()}@test.com`,
            gender: 'Male',
            mobile: '1234567890',
            hobbies: ['Sports', 'Reading'],
            currentAddress: '123 Test Street',
            state: 'NCR',
            city: 'Delhi',
            subjects: ['Physics']
        };

        // Fill personal information using ID selectors
        await this.page.locator('#firstName').fill(testData.firstName);
        await this.page.locator('#lastName').fill(testData.lastName);
        await this.page.locator('#userEmail').fill(testData.email);
        await this.takeScreenshot('personal info filled');

        // Select gender using name attribute
        // Radio buttons in a group share the same name attribute 'gender'
        // We use the label text to select the specific option
        await this.page.locator('input[name="gender"][value="Male"]').click({ force: true });

        // Fill mobile number using ID
        await this.page.locator('#userNumber').fill(testData.mobile);

        // Handle subject autocomplete
        // We need to type slowly to trigger the autocomplete dropdown
        await this.page.locator('#subjectsContainer input').click();
        // Type 'P' and wait for dropdown
        await this.page.locator('#subjectsContainer input').type('P', { delay: 100 });
        await this.page.waitForSelector('.subjects-auto-complete__menu');
        await this.takeScreenshot('subject autocomplete shown');
        
        // Wait for and click the Physics option
        await this.page.getByText('Physics', { exact: true }).click();
        await this.takeScreenshot('physics subject selected');
        
        /// Select hobbies using label-based selection
        for (const hobby of testData.hobbies) {
            // Find the label containing our hobby text
            const hobbyLabel = this.page
                .locator('label')
                .filter({ hasText: hobby });

            // Get the input associated with this label and click it
            await hobbyLabel.click({ force: true });
            
            // Verify the checkbox was actually checked
            /*
            attribute for because id is identified here
            <label for="hobbies-checkbox-1">Sports</label>
            */
            const inputId = await hobbyLabel.getAttribute('for');
            const checkbox = this.page.locator(`#${inputId}`);
            await expect(checkbox).toBeChecked();
        }
        await this.takeScreenshot('hobbies selected');

        // Fill current address using ID
        await this.page.locator('#currentAddress').fill(testData.currentAddress);

        // Verify city dropdown input is disabled initially
        // The actual disabled state is on the input element inside the React-Select container
        const cityInput = this.page.locator('#city input');
        await expect(cityInput).toBeDisabled();
        await this.takeScreenshot('city dropdown disabled');

        // Select state and city using IDs
        // We need to use the react-select wrapper divs since these are custom dropdowns
        await this.page.locator('#state').click();
        await this.page.getByText(testData.state, { exact: true }).click();
        
        // Verify city input is now enabled after state selection
        await expect(cityInput).toBeEnabled();
        
        await this.page.locator('#city').click();
        await this.page.getByText(testData.city, { exact: true }).click();
        await this.takeScreenshot('location selected');

        // Submit the form using ID
        await this.page.locator('#submit').click();
        await this.takeScreenshot('form submitted');

        // Verify popup content
        const popup = this.page.locator('.modal-content');
        await expect(popup).toBeVisible();

        // Verify all fields in the popup
        const tableRows = popup.locator('tbody tr');
        
        const expectedValues = [
            ['Student Name', `${testData.firstName} ${testData.lastName}`],
            ['Student Email', testData.email],
            ['Gender', testData.gender],
            ['Mobile', testData.mobile],
            ['Subjects', testData.subjects.join(', ')],
            ['Hobbies', testData.hobbies.join(', ')],
            ['Address', testData.currentAddress],
            ['State and City', `${testData.state} ${testData.city}`]
        ];

        // Verify each row in the confirmation popup
        for (const [label, value] of expectedValues) {
            const row = tableRows.filter({ hasText: label });
            await expect(row).toContainText(value);
        }

        return testData;
    }
}

module.exports = ComplexInteractionHelper;