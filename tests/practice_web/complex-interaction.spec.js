const { test, expect } = require('@playwright/test');
const ComplexInteractionHelper = require('../../utils/complexInteractionUtils');

test.describe('Complex UI Interactions', () => {
    let helper;

    // Using fixtures in beforeEach
    test.beforeEach(async ({ page }, testInfo) => {
        helper = new ComplexInteractionHelper(page, testInfo);
    });

    test('should navigate nested dropdown menu', async () => {
        await helper.navigateNestedDropdown();
    });

    test('should handle searchable dynamic form', async () => {
        const isSelected = await helper.fillDynamicSearchableForm();
        expect(isSelected).toBe(true);
    });

    test('should handle multi-select dropdown', async () => {
        const selectedSkills = await helper.handleMultiSelect();
        expect(selectedSkills).toHaveLength(3);
    });

    test.only('should fill conditional dynamic form', async () => {
        await helper.fillDynamicConditionalForm();
    });
});