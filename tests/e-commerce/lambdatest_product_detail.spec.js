const { test, expect, request } = require('@playwright/test');
const LambdaTestApiUtils = require('../../utils/LambdaTestApiUtils');
const ProductDetailPage = require('../../web/pages/e-commerce/product_detail_page');
const CommonPage = require('../../web/pages/e-commerce/common_page');
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

    await page.context().addCookies(apiCookies);

    const productDetailPage = new ProductDetailPage(page);
    const commonPage = new CommonPage(page);

    // Navigate to product page
    const productData = testData.product;
    await page.goto(`https://ecommerce-playground.lambdatest.io/index.php?route=product/product&product_id=${productData.product_id}`);

    await productDetailPage.addToCart();

    // Verify toast popup
    await commonPage.verifyToastPopup(productData.product_name, testData.page_name.cart_page);

    // Verify cart icon updates
    await productDetailPage.verifyCartItemCount('1');
});
