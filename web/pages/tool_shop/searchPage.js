const BasePage = require('./basePage');

class SearchPage extends BasePage {
    constructor(page, baseURL) {
        super(page, baseURL);
        this.priceRangeMin = this.page.locator('span.ngx-slider-pointer-min[role="slider"]');
        this.priceRangeMax = this.page.locator('span.ngx-slider-pointer-max[role="slider"]');
        this.sortDropdown = this.page.locator('[data-test="sort"]');
        this.brandCheckbox = (brand) => this.page.locator(`label`, { hasText: brand.trim()}).locator('input[type="checkbox"]');
        this.searchInput = this.page.locator('[data-test="search-query"]');
        this.searchReset = this.page.locator('[data-test="search-reset"]');
        this.searchResults = this.page.locator('.card-body');
        this.productPrices = this.page.locator('[data-test="product-price"]');
        this.productNames = this.page.locator('.card-title');
        this.searchKeywordText = this.page.locator('[data-test="search-caption"]');
        this.filterSection = this.page.locator('#filters'); 
        this.brandSection = this.page.locator('text=By brand:');
        this.paginationSection = this.page.locator('.pagination');
    }

    /**
     * Get the price text for a specific product
     * @param {string} productName - Name of the product to get price for
     * @returns {Promise<string>} - The price text of the product
     */
    async getProductPrice(productName) {
        //h5[normalize-space()="${product_name}"]/parent::div/following-sibling::div//span[@data-test="product-price"]
        const priceLocator = this.page.locator('h5', {
            hasText: productName
        })
        .locator('xpath=..')
        .locator('xpath=following-sibling::div')
        .locator('[data-test="product-price"]');

        // Wait for the price to be visible
        await priceLocator.waitFor({ state: 'visible' });
        
        // Return the actual price text
        return await priceLocator.innerText();
    }

    /**
     * Get the numeric price value for a specific product
     * @param {string} productName - Name of the product to get price for
     * @returns {Promise<number>} - The price as a number
     */
    async getProductPriceAsNumber(productName) {
        const priceText = await this.getProductPrice(productName);
        return parseFloat(priceText.replace('$', ''));
    }

    /**
     * Check if a specific product is out of stock
     * @param {string} productName - Name of the product to check
     * @returns {Promise<boolean>} - True if the product is out of stock
     */
     async isProductOutOfStock(productName) {
        //h5[normalize-space()="${product_name}"]/parent::div/following-sibling::div/span[text()="Out of stock"]
        const outOfStockLabel = this.page.locator('h5', {
            hasText: productName
        })
        .locator('xpath=..') // Goes up to the parent div that contains both title and stock status
        .locator('xpath=following-sibling::div') // Moves to the sibling div after our parent
        .locator('span', { hasText: 'Out of stock' }); // Find the specific 'Out of stock' span

        return await outOfStockLabel.isVisible();
    }

    /**
     * Filter products by price range and wait for results to update
     */
    /**
     * Filter products by price range using the slider
     * @param {number} min - Minimum price (0-200)
     * @param {number} max - Maximum price (0-200)
     */
    async filterPriceRange(min = null, max = null) {
        // Wait for sliders to be visible
        await this.priceRangeMin.waitFor({ state: 'visible' });
        await this.priceRangeMax.waitFor({ state: 'visible' });
    
        // Get the possible range from aria attributes
        const minPossible = parseInt(await this.priceRangeMin.getAttribute('aria-valuemin')) || 0;
        const maxPossible = parseInt(await this.priceRangeMax.getAttribute('aria-valuemax')) || 200;
    
        // If no values provided, generate random values within the possible range
        const targetMin = min ?? Math.floor(Math.random() * (maxPossible / 2));
        const targetMax = max ?? Math.floor((maxPossible + targetMin) / 2 + Math.random() * (maxPossible - targetMin));
    
        // Ensure values are within bounds
        const safeMin = Math.max(minPossible, Math.min(targetMin, maxPossible));
        const safeMax = Math.max(safeMin, Math.min(targetMax, maxPossible));
    
        // Log initial state
        //console.log(`Setting price range: $${safeMin} - $${safeMax}`);
    
        // Move slider to target value using keyboard
        const moveSlider = async (slider, targetValue) => {
            await slider.click(); // Focus the slider
            const currentValue = parseInt(await slider.getAttribute('aria-valuenow'));
            const difference = targetValue - currentValue;
            const key = difference > 0 ? 'ArrowRight' : 'ArrowLeft';
            const steps = Math.abs(difference);
            
            //console.log(`Moving slider from ${currentValue} to ${targetValue}`);
            for (let i = 0; i < steps; i++) {
                await slider.press(key);
                await this.page.waitForTimeout(50);
            }
        };
    
        // Move both sliders to their target positions
        await moveSlider(this.priceRangeMin, safeMin);
        await moveSlider(this.priceRangeMax, safeMax);
    
        // Wait for UI to reflect the changes
        await this.page.waitForLoadState('networkidle');
        await this.productNames.first().waitFor({ state: 'visible' });
    
        // Take a full page screenshot for debugging
        await this.page.screenshot({ 
            path: 'price-filter-debug.png',
            fullPage: true 
        });
    
        // Get actual prices after filter
        const prices = await this.getSearchResultPrices();
        //console.log('Found prices after filter:', prices.map(p => parseFloat(p.replace('$', ''))));
    
        return { min: safeMin, max: safeMax };
    }

     /**
     * Sort products and wait for the sorting to complete
     */
    /**
     * Sort products by the given criteria
     * @param {string} option - Sort option ('name,asc', 'name,desc', 'price,asc', 'price,desc')
     */
    async sortBy(option) {
        await this.sortDropdown.waitFor({ state: 'visible' });
        
        // Map friendly names to actual option values
        const sortOptions = {
            'name_asc': 'name,asc',
            'price_asc': 'price,asc',
            'name_desc': 'name,desc',
            'price_desc': 'price,desc'
        };

        const sortValue = sortOptions[option] || option;
        await this.sortDropdown.selectOption(sortValue);
        // Wait for loading state
        await this.page.waitForLoadState('networkidle');
        // Wait for results to update
        await this.page.waitForTimeout(1000); // Brief wait for sorting
        // Wait for UI to update
        await this.productNames.first().waitFor({ state: 'visible' });
    }

    /**
     * Filter products by brand with proper scrolling and verification
     */
    async filterByBrand(brand, maxAttempts = 3) {
        // Store initial products for comparison
        const initialProducts = await this.productNames.allInnerTexts();
        
        // First scroll to filter section
        await this.filterSection.scrollIntoViewIfNeeded();
        // Then scroll to brand section specifically
        await this.brandSection.scrollIntoViewIfNeeded();
        
        const brandFilter = this.brandCheckbox(brand);
        await brandFilter.waitFor({ state: 'visible' });
        await brandFilter.click();
    
        // Retry loop to wait for products to update
        let attempts = 0;
        while (attempts < maxAttempts) {
            try {
                //console.log(`Attempt ${attempts + 1}: Waiting for product list to update`);
                
                // Wait for network and animation
                await this.page.waitForLoadState('networkidle');
                await this.page.waitForTimeout(1000);
    
                // Wait for at least one product to be visible
                await this.searchResults.first().waitFor({ state: 'visible' });
    
                // Get new product list
                const newProducts = await this.productNames.allInnerTexts();
    
                // Compare with initial list
                if (newProducts.length !== initialProducts.length || 
                    JSON.stringify(newProducts) !== JSON.stringify(initialProducts)) {
                    //console.log('Product list updated successfully');
                    return;
                }
    
                console.log('Product list unchanged, retrying...');
                attempts++;
                
                if (attempts < maxAttempts) {
                    // Try clicking the filter again
                    await brandFilter.click();
                    await this.page.waitForTimeout(1000);
                }
            } catch (error) {
                console.log(`Attempt ${attempts + 1} failed:`, error.message);
                attempts++;
                
                if (attempts === maxAttempts) {
                    throw error;
                }
            }
        }
    
        throw new Error('Product list did not update after applying brand filter');
    }

    /**
     * Search for products and wait for results
     */
    async search(keyword) {
        await this.searchInput.waitFor({ state: 'visible' });
        await this.searchInput.fill(keyword);
        await this.searchInput.press('Enter');
    
        // Wait for search results text to appear
        await this.searchKeywordText.waitFor({ state: 'visible' });
        
        // Wait for either product names to be visible or "No results" message
        await Promise.race([
            this.page.locator('.card-title').first().waitFor({ 
                state: 'visible', 
                timeout: 5000 
            }),
            this.page.locator('text=No results found').waitFor({ 
                state: 'visible', 
                timeout: 5000 
            })
        ]).catch(() => {
            throw new Error('Search results or "No results found" message did not load properly');
        });
    
        // Wait for search results to stabilize
        await this.page.waitForLoadState('networkidle');
    
        // Verify search result matches keyword
        const searchResults = await this.productNames.allInnerTexts();
        const exactMatch = searchResults.find(name => name.includes(keyword));
        if (!exactMatch) {
            // Take screenshot for debugging
            await this.page.screenshot({ 
                path: 'search-results-mismatch.png',
                fullPage: true 
            });
            throw new Error(`Could not find "${keyword}" in search results: ${searchResults.join(', ')}`);
        }
    
        // Find and return the exact product card
        const exactProductIndex = searchResults.findIndex(name => 
            name.includes(keyword)
        );
    
        return exactProductIndex;
    }

    /**
     * Get total number of products found from search
     * @returns {Promise<number>} Total number of products found
     */
    async getTotalSearchResults() {
        // Wait for all results to load
        await this.page.waitForLoadState('networkidle');
        // Method 1: Using count()
        await this.searchResults.first().waitFor({ state: 'visible' });
        return await this.searchResults.count();

        // Alternative Method 2: Using allInnerTexts() length
        // const allProducts = await this.productNames.allInnerTexts();
        // return allProducts.length;
    }

    /**
     * Search for products and return total found
     * @param {string} keyword - Search keyword
     * @returns {Promise<{total: number, searchText: string}>} Total products found and search result text
     */
    async searchAndGetTotal(keyword) {
        await this.search(keyword);
        
        // Wait for search to complete
        await this.page.waitForLoadState('networkidle');

        // Get total results
        const total = await this.getTotalSearchResults();
        
        // Get search result text (e.g., "Searched for: keyword")
        const searchText = await this.searchKeywordText.innerText();

        return {
            total,
            searchText
        };
    }

    async clearSearchResult() {
        await this.searchReset.click();
        await this.searchKeywordText.waitFor({ state: 'hidden' });
        await this.page.waitForLoadState('networkidle');
        await this.paginationSection.waitFor({ state: 'visible' });
        await this.searchResults.first().waitFor({ state: 'visible' });
    }

    /**
     * Get all product prices from search results
     */
    async getSearchResultPrices() {
        await this.productPrices.first().waitFor({ state: 'visible' });
        return await this.productPrices.allInnerTexts();
    }

    /**
     * Get a random product from search results
     */
    async getRandomProduct() {
        await this.searchResults.first().waitFor({ state: 'visible' });
        const products = await this.searchResults.all();
        if (products.length === 0) {
            throw new Error('No products found in search results');
        }
        const randomIndex = Math.floor(Math.random() * products.length);
        return products[randomIndex];
    }
}

module.exports = SearchPage;