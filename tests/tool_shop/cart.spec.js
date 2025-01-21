const { test, expect } = require('@playwright/test');
const SearchPage = require('../../web/pages/tool_shop/searchPage');
const ProductDetailPage = require('../../web/pages/tool_shop/productDetailPage');
const CartPage = require('../../web/pages/tool_shop/cartPage');
const ProductFeature = require('../../web/features/tool_shop/productFeature');

test.describe('Tests for Practice Software Testing Website: cart page', () => {
    // Define base URL that can be easily changed for different environments
    const BASE_URL = 'https://practicesoftwaretesting.com';
    
    test.beforeEach(async ({ page }) => {
        await page.goto(BASE_URL , {waitUntil: "domcontentloaded"} );
    });

    test('adjust quantities of multiple products and verify totals in cart page', async ({ page }) => {
        const productDetailPage = new ProductDetailPage(page, BASE_URL);
        const cartPage = new CartPage(page, BASE_URL);
        const productFeature = new ProductFeature(page, BASE_URL);
    
        // Add initial products to cart
        const productsToAdd = [
            { productName: 'Hammer', quantity: 1 },
            { productName: 'Pliers', quantity: 1 }
        ];
    
        const addedProducts = await productFeature.addMultipleProductsToCart(productsToAdd);
        await productDetailPage.goToCart();

        // Define the quantities we want to adjust on cart page
        const product1NewQuantity = 4; // Hammer
        const product2NewQuantity = 1; // Pliers
    
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