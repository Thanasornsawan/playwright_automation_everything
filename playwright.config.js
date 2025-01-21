// @ts-check
const { devices } = require('@playwright/test');
require('dotenv').config({ path: '.env' });

const config = {
  testDir: './tests',
  timeout: 120000,  // 2 minutes global timeout
  expect: {
    timeout: 45000  // 45 seconds for expects
  },
  reporter: [
    ["list"],
    ['playwright-ctrf-json-reporter', {outputFile: 'test-report.json', outputDir: 'report-results',}],
    ['html', { open: 'never' }],
    ["allure-playwright"],
    ['@zealteam/testrail-reporter'],
    [
      'playwright-qase-reporter',
      {
        debug: true,
        testops: {
          api: {
            token: process.env.QASE_TESTOPS_API_TOKEN,
          },
          project: process.env.QASE_PROJECT_CODE,
          uploadAttachments: true,
          run: {
            complete: true,
          },
        },
      },
    ],
  ],
  
  use: {
    browserName: 'chromium',  
    headless: true,           
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 45000,  // Actions like click
    navigationTimeout: 45000,  // Navigation timeout
  },
  retries: 1,  // Retry failed tests once
  workers: 2,  // Reduce parallel workers to prevent race conditions
  fullyParallel: false  // Disable full parallelism
};

module.exports = config;