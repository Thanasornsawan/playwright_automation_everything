const { test, expect } = require('@playwright/test');
const SearchPage = require('../../web/pages/tool_shop/searchPage');
const ProductDetailPage = require('../../web/pages/tool_shop/productDetailPage');

test.describe('Tests for Practice Software Testing Website: search page', () => {
    // Define base URL that can be easily changed for different environments
    const BASE_URL = 'https://practicesoftwaretesting.com';
    
    test.beforeEach(async ({ page }) => {
        await page.goto(BASE_URL , {waitUntil: "domcontentloaded"} );
    });

    test('should filter products by price range using slider', async ({ page }) => {
        const searchPage = new SearchPage(page, BASE_URL);
        
        // Use specific price range for testing
        const { min: appliedMin, max: appliedMax } = await searchPage.filterPriceRange(16, 110);
        
        // Get and verify filtered prices
        const prices = await searchPage.getSearchResultPrices();
        expect(prices.length).toBeGreaterThan(0);
        
        // Log all prices for debugging
        const numericPrices = prices.map(price => parseFloat(price.replace('$', '')));
        //console.log('Applied range:', { min: appliedMin, max: appliedMax });
        //console.log('All prices found:', numericPrices);
        
        // Verify each price
        const outOfRangePrices = numericPrices.filter(price => 
            price < appliedMin || price > appliedMax
        );
        
        if (outOfRangePrices.length > 0) {
            console.log('Found prices outside range:', outOfRangePrices);
            // Take another screenshot at failure point
            await page.screenshot({ 
                path: 'price-filter-failure.png',
                fullPage: true 
            });
        }
        
        expect(outOfRangePrices).toHaveLength(0, 
            `Found ${outOfRangePrices.length} prices outside range ${appliedMin}-${appliedMax}`
        );
        
        // Log the range used for reference
        //console.log(`Successfully tested price range: $${appliedMin} - $${appliedMax}`);
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

    test('should filter by MightyCraft Hardware brand', async ({ page }) => {
        const searchPage = new SearchPage(page, BASE_URL);
        const productDetailPage = new ProductDetailPage(page, BASE_URL);
        
        // Wait for page to be fully loaded
        await page.waitForLoadState('networkidle');
        
        // Apply brand filter
        await searchPage.filterByBrand('MightyCraft Hardware');
        
        // Click the first filtered product
        await searchPage.searchResults.first().click();
        
        // Wait for product details to load
        await page.waitForLoadState('networkidle');
        await productDetailPage.brandLabel.waitFor({ state: 'visible' });
        
        // Verify brand
        const brandText = await productDetailPage.brandLabel.innerText();
        expect(brandText).toBe('MightyCraft Hardware');
    });

    test('should return correct search result count', async ({ page }) => {
        const searchPage = new SearchPage(page, BASE_URL);
        
        const searchKeyword = 'Long Nose Pliers';

        // Search and get total
        const { total, searchText } = await searchPage.searchAndGetTotal(searchKeyword);
        
        // Verify results
        expect(total).toBe(1);
        expect(searchText).toBe(`Searched for: ${searchKeyword}`);
    
        await searchPage.clearSearchResult();
        const totalProducts = await searchPage.getTotalSearchResults();
        expect(totalProducts).toBeGreaterThan(total);
    });

});