const { test, expect, request } = require('@playwright/test');
const LambdaTestApiUtils = require('../../utils/LambdaTestApiUtils');
const ProductDetailPage = require('../../web/pages/e-commerce/product_detail_page');
const CommonPage = require('../../web/pages/e-commerce/common_page');
const CheckoutPage = require('../../web/pages/e-commerce/checkout_page');
const testData = require('../../data/e-commerce/testData.json');

let apiCookies;
let apiUtils;

test.beforeAll(async () => {
    const apiContext = await request.newContext();
    apiUtils = new LambdaTestApiUtils(apiContext, testData.user_account.user_account1);
    
    try {
        apiCookies = await apiUtils.login();
        
        // Verify login status
        const loginStatus = await apiUtils.verifyLoginStatus();
        if (!loginStatus.isLoggedIn) {
            throw new Error(`Login verification failed. Status: ${loginStatus.accountStatus}`);
        }
        
        console.log("Login verified successfully");
    } catch (error) {
        console.error('Test setup failed:', error.message);
        throw error; 
    }
});

test.beforeEach(async () => {
    // Verify login status before each test
    const loginStatus = await apiUtils.verifyLoginStatus();
    if (!loginStatus.isLoggedIn) {
        throw new Error('Session expired or invalid');
    }
});

test('Add product to cart and verify in UI', async ({ page }) => {
    if (!apiCookies) {
        throw new Error('No cookies available from login');
    }

    // Add cookies to the page context
    await page.context().addCookies(apiCookies);

    const productDetailPage = new ProductDetailPage(page);
    const commonPage = new CommonPage(page);
    const checkoutPage = new CheckoutPage(page);

    // Clear cart before adding product
    await page.goto("https://ecommerce-playground.lambdatest.io/index.php?route=checkout/checkout");
    await page.waitForLoadState('load');
    await checkoutPage.clearCart();
    
    // Wait briefly for cart clearing to complete
    await page.waitForTimeout(2000);

    // Navigate to product page with retry logic
    const productData = testData.product;
    await page.goto(
        `https://ecommerce-playground.lambdatest.io/index.php?route=product/product&product_id=${productData.product_id}`,
        { waitUntil: 'domcontentloaded', timeout: 30000 }
    );

    // Wait for page to be fully loaded before proceeding
    await page.waitForLoadState('load');

    await productDetailPage.addToCart();

    // Verify toast popup
    await commonPage.verifyToastPopup(productData.product_name, testData.page_name.cart_page);

    // Verify cart icon updates
    await productDetailPage.verifyCartItemCount('1');
});