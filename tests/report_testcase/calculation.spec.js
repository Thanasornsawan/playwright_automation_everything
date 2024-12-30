const { test, expect } = require('@playwright/test');
import { qase } from 'playwright-qase-reporter';

// A simple function for addition
function add(a, b) {
  return a + b;
}

// A simple function for subtraction
function subtract(a, b) {
  return a - b;
}

test.describe('Simple Calculation Tests', () => {

  test('@C1 calculation additional logic should pass', async () => {
    qase.id(1);
    await test.step("Step 1: 2+3 should be 5", async () => {
      const result = add(2, 3);
      expect(result).toBe(5); // This test will pass
    });
  });

  test('@C2 calculation subtraction logic should fail', async () => {
    qase.id(2);
    await test.step("Step 1: 5-3 should not be 5", async () => {
      const result = subtract(5, 3);
      expect(result).toBe(5); // This test will fail because the result should be 2
    });
  });
});