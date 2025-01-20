const { test, expect } = require('@playwright/test');
const SearchPage = require('../../web/pages/tool_shop/searchPage');
const ProductDetailPage = require('../../web/pages/tool_shop/productDetailPage');
const CartPage = require('../../web/pages/tool_shop/cartPage');
const ProductFeature = require('../../web/features/tool_shop/productFeature');

test.describe('E2E Tests for Practice Software Testing Website', () => {
    // Define base URL that can be easily changed for different environments
    const BASE_URL = 'https://practicesoftwaretesting.com';
    
    test.beforeEach(async ({ page }) => {
        await page.goto(BASE_URL , {waitUntil: "domcontentloaded"} );
    });

    test('should filter products by price range using slider', async ({ page }) => {
        const searchPage = new SearchPage(page, BASE_URL);
        
        // Use random price range
        const { min: appliedMin, max: appliedMax } = await searchPage.filterPriceRange();
        
        // Get and verify filtered prices
        const prices = await searchPage.getSearchResultPrices();
        expect(prices.length).toBeGreaterThan(0);
        
        prices.forEach(price => {
            const numericPrice = parseFloat(price.replace('$', ''));
            expect(numericPrice).toBeGreaterThanOrEqual(appliedMin);
            expect(numericPrice).toBeLessThanOrEqual(appliedMax);
        });
        
        // Log the random range used for debugging
        console.log(`Tested price range: $${appliedMin} - $${appliedMax}`);
    });

    test('should sort products by name and price', async ({ page }) => {
        const searchPage = new SearchPage(page, BASE_URL);
        
        // Sort by name ascending
        await searchPage.sortBy('name,asc');
        const productNames = await searchPage.productNames.allInnerTexts();
        const sortedNames = [...productNames].sort((a, b) => 
            a.toLowerCase().localeCompare(b.toLowerCase())
        );
        expect(productNames).toEqual(sortedNames);

        // Sort by price ascending
        await searchPage.sortBy('price,asc');
        const prices = await searchPage.getSearchResultPrices();
        const numericPrices = prices.map(price => parseFloat(price.replace('$', '')));
        expect([...numericPrices]).toEqual([...numericPrices].sort((a, b) => a - b));
    });

    test('should filter by MightyCraft Hardware brand and verify random product', async ({ page }) => {
        const searchPage = new SearchPage(page, BASE_URL);
        const productDetailPage = new ProductDetailPage(page, BASE_URL);
        
        // Apply brand filter and select random product
        await searchPage.filterByBrand('MightyCraft Hardware');
        const randomProduct = await searchPage.getRandomProduct();
        await randomProduct.click();
        
        // Verify the selected product's brand
        const brandText = await productDetailPage.brandLabel.innerText();
        expect(brandText).toBe('MightyCraft Hardware');
    });

    test('should search for Long Nose Pliers and verify out of stock behavior', async ({ page }) => {
        const searchPage = new SearchPage(page, BASE_URL);
        const productDetailPage = new ProductDetailPage(page, BASE_URL);
        
        const searchKeyword = 'Long Nose Pliers';
        await searchPage.search(searchKeyword);
        
        // Verify search result text
        const searchResultText = await searchPage.searchKeywordText.innerText();
        expect(searchResultText).toBe(`Searched for: ${searchKeyword}`);

        // Verify out of stock in search results
        const isOutOfStock = await searchPage.isProductOutOfStock(searchKeyword);
        expect(isOutOfStock).toBe(true);

        const price_card = await searchPage.getProductPriceAsNumber(searchKeyword);

        // Verify out of stock behavior on product detail page
        await searchPage.searchResults.first().click();
        const product_unit_price = parseFloat((await productDetailPage.productPrice.innerText()).replace('$', ''));
        expect(product_unit_price).toBe(price_card);
        await expect(productDetailPage.outOfStockLabel).toBeVisible();
        await expect(productDetailPage.quantityPlus).toBeDisabled();
        await expect(productDetailPage.quantityMinus).toBeDisabled();
        await expect(productDetailPage.addToCartButton).toBeDisabled();
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

    test('adjust quantities of multiple products and verify totals in cart page', async ({ page }) => {
        const productDetailPage = new ProductDetailPage(page, BASE_URL);
        const cartPage = new CartPage(page, BASE_URL);
        const productFeature = new ProductFeature(page, BASE_URL);
        
        // Define the quantities we want to adjust on cart page
        const product1NewQuantity = 4; // Hammer
        const product2NewQuantity = 1; // Pliers
    
        // Add initial products to cart
        const productsToAdd = [
            { productName: 'Hammer', quantity: 1 },
            { productName: 'Pliers', quantity: 1 }
        ];
    
        const addedProducts = await productFeature.addMultipleProductsToCart(productsToAdd);
        await productDetailPage.goToCart();
    
        // Verify initial state and adjust first product (Hammer)
        const product1Info = await cartPage.getProductPriceInfo(addedProducts[0].name);
        expect(product1Info.quantity).toBe(addedProducts[0].initialQuantity); // Use the actual initial quantity
        await cartPage.adjustProductQuantity(addedProducts[0].name, product1NewQuantity);
        
        // Get updated info for first product after adjustment
        const updatedProduct1Info = await cartPage.getProductPriceInfo(addedProducts[0].name);
        expect(updatedProduct1Info.quantity).toBe(product1NewQuantity);
        expect(updatedProduct1Info.totalPrice).toBeCloseTo(addedProducts[0].price * product1NewQuantity, 2);
        
        // Verify initial state and adjust second product (Pliers)
        const product2Info = await cartPage.getProductPriceInfo(addedProducts[1].name);
        expect(product2Info.quantity).toBe(addedProducts[1].initialQuantity); // Use the actual initial quantity
        await cartPage.adjustProductQuantity(addedProducts[1].name, product2NewQuantity);
        
        // Get updated info for second product after adjustment
        const updatedProduct2Info = await cartPage.getProductPriceInfo(addedProducts[1].name);
        expect(updatedProduct2Info.quantity).toBe(product2NewQuantity);
        expect(updatedProduct2Info.totalPrice).toBeCloseTo(addedProducts[1].price * product2NewQuantity, 2);
        
        // Verify total cart amount after both adjustments
        const expectedTotal = (addedProducts[0].price * product1NewQuantity) + 
                            (addedProducts[1].price * product2NewQuantity);
        const actualTotal = await cartPage.getCartTotal();
        expect(actualTotal).toBeCloseTo(expectedTotal, 2);
        
        // Test deletion of first product
        await cartPage.deleteProduct(addedProducts[0].name);
        
        // Verify first product was removed
        await expect(page.locator(`text=${addedProducts[0].name}`)).not.toBeVisible();
        
        // Verify cart total is now just second product's total
        const finalTotal = await cartPage.getCartTotal();
        expect(finalTotal).toBeCloseTo(addedProducts[1].price * product2NewQuantity, 2);

    });
});