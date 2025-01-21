const { test, expect } = require('@playwright/test');
const SearchPage = require('../../web/pages/tool_shop/searchPage');
const ProductDetailPage = require('../../web/pages/tool_shop/productDetailPage');
const CartPage = require('../../web/pages/tool_shop/cartPage');
const ProductFeature = require('../../web/features/tool_shop/productFeature');

test.describe('Tests for Practice Software Testing Website: product page', () => {
    // Define base URL that can be easily changed for different environments
    const BASE_URL = 'https://practicesoftwaretesting.com';
    
    test.beforeEach(async ({ page }) => {
        await page.goto(BASE_URL , {waitUntil: "domcontentloaded"} );
    });

    test('should search for Long Nose Pliers and verify out of stock behavior', async ({ page }) => {
        const searchPage = new SearchPage(page, BASE_URL);
        const productDetailPage = new ProductDetailPage(page, BASE_URL);
        
        const searchKeyword = 'Long Nose Pliers';
        
        // Search and get exact product index
        const exactProductIndex = await searchPage.search(searchKeyword);
        
        // Verify search result text
        const searchResultText = await searchPage.searchKeywordText.innerText();
        expect(searchResultText).toBe(`Searched for: ${searchKeyword}`);
    
        // Verify out of stock in search results
        const isOutOfStock = await searchPage.isProductOutOfStock(searchKeyword);
        expect(isOutOfStock).toBe(true);
    
        const price_card = await searchPage.getProductPriceAsNumber(searchKeyword);
    
        // Click the exact product we found
        await searchPage.searchResults.nth(exactProductIndex).click();
        
        // Verify details in product page
        const product_unit_price = parseFloat((await productDetailPage.productPrice.innerText()).replace('$', ''));
        expect(product_unit_price).toBe(price_card);
        await expect(productDetailPage.outOfStockLabel).toBeVisible();
        await expect(productDetailPage.quantityPlus).toBeDisabled();
        await expect(productDetailPage.quantityMinus).toBeDisabled();
        await expect(productDetailPage.addToCartButton).toBeDisabled();
    });

    test('should verify related prodcut match main product category using new tabs', async ({ page, context }) => {
        const searchPage = new SearchPage(page, BASE_URL);
        const productDetailPage = new ProductDetailPage(page, BASE_URL);

        // Start with a specific product search
        await searchPage.search('Pliers');
        await searchPage.searchResults.first().click();

        // Get initial category and related products
        const mainCategory = await productDetailPage.getCategory();
        const relatedProducts = await productDetailPage.getRelatedProductNames();
        
        //console.log(`Main category: ${mainCategory}`);
        //console.log(`Found ${relatedProducts.length} related products`);

        // Check each related product in new tabs
        for (let i = 0; i < relatedProducts.length; i++) {
            // Open product in new tab
            const newPage = await productDetailPage.openRelatedProductInNewTab(i);
            
            // Create ProductDetailPage instance for new tab
            const newProductDetail = new ProductDetailPage(newPage, BASE_URL);
            
            // Verify category
            const currentCategory = await newProductDetail.getCategory();
            expect(currentCategory).toBe(mainCategory);
            
            const productName = await newProductDetail.productName.innerText();
            //console.log(`Verified category for: ${productName}`);

            // Close the tab
            await newPage.close();
        }
    });

    test('adjust quantity on product detail page and verify cart page match', async ({ page }) => {
        const productDetailPage = new ProductDetailPage(page, BASE_URL);
        const cartPage = new CartPage(page, BASE_URL);
        const productFeature = new ProductFeature(page, BASE_URL);
        
        // Define products to add with their quantities
        const productsToAdd = [
            { productName: 'Hammer', quantity: 3 },
            { productName: 'Pliers', quantity: 2 }
        ];
    
        // Add products to cart using ProductFeature
        const addedProducts = await productFeature.addMultipleProductsToCart(productsToAdd);
        
        // Go to cart to verify all details
        await productDetailPage.goToCart();
        
        // Verify first product details
        const product1Info = await cartPage.getProductPriceInfo(addedProducts[0].name);
        expect(product1Info.quantity).toBe(productsToAdd[0].quantity);
        expect(product1Info.unitPrice).toBe(addedProducts[0].price);
        expect(product1Info.totalPrice).toBeCloseTo(addedProducts[0].price * productsToAdd[0].quantity, 2);
        
        // Verify second product details
        const product2Info = await cartPage.getProductPriceInfo(addedProducts[1].name);
        expect(product2Info.quantity).toBe(productsToAdd[1].quantity);
        expect(product2Info.unitPrice).toBe(addedProducts[1].price);
        expect(product2Info.totalPrice).toBeCloseTo(addedProducts[1].price * productsToAdd[1].quantity, 2);
        
        // Verify total cart amount
        const expectedTotal = (addedProducts[0].price * productsToAdd[0].quantity) + 
                             (addedProducts[1].price * productsToAdd[1].quantity);
        const actualTotal = await cartPage.getCartTotal();
        expect(actualTotal).toBeCloseTo(expectedTotal, 2);
    });

});