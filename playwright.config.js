// @ts-check
const { devices } = require('@playwright/test');
require('dotenv').config({ path: '.env' });

const config = {
  testDir: './tests',
  retries: 0,
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  reporter: [
    ["list"],
    ['json', { outputFile: 'results.json' }],
    ['html', { outputDir: 'html-report' }],
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
  },
};

module.exports = config;