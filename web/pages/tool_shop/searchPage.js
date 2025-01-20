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

        // Function to move slider to target value using keyboard
        const moveSlider = async (slider, targetValue) => {
            await slider.click(); // Focus the slider
            const currentValue = parseInt(await slider.getAttribute('aria-valuenow'));
            const difference = targetValue - currentValue;
            const key = difference > 0 ? 'ArrowRight' : 'ArrowLeft';
            const steps = Math.abs(difference);
            
            for (let i = 0; i < steps; i++) {
                await slider.press(key);
                // Small wait between keypresses to ensure slider updates
                await this.page.waitForTimeout(50);
            }
        };

        // Move both sliders to their target positions
        await moveSlider(this.priceRangeMin, safeMin);
        await moveSlider(this.priceRangeMax, safeMax);

        // Wait for UI to reflect the changes
        await this.productNames.first().waitFor({ state: 'visible' });

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
        
        // Wait for UI to update
        await this.productNames.first().waitFor({ state: 'visible' });
    }

    /**
     * Filter products by brand with proper scrolling and verification
     */
    async filterByBrand(brand) {
        // First scroll to filter section
        await this.filterSection.scrollIntoViewIfNeeded();
        // Then scroll to brand section specifically
        await this.brandSection.scrollIntoViewIfNeeded();
        // Small wait to ensure the scroll has completed
        await this.page.waitForTimeout(500);
        
        const brandFilter = this.brandCheckbox(brand);
        // Wait for the specific brand checkbox to be visible and interactive
        await brandFilter.waitFor({ state: 'visible' });
        
        // Click the brand checkbox
        await brandFilter.click();

        // Additional wait for the UI to update
        await this.searchResults.first().waitFor({ state: 'visible' });
    }

    /**
     * Search for products and wait for results
     */
    async search(keyword) {
        await this.searchInput.waitFor({ state: 'visible' });
        await this.searchInput.fill(keyword);
        await this.searchInput.press('Enter');

        // Wait for the search results text to appear
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

        // Additional wait to ensure price is also loaded if products are found
        if (await this.page.locator('.card-title').first().isVisible()) {
            await this.page.locator('[data-test="product-price"]').first().waitFor({ 
                state: 'visible',
                timeout: 5000 
            });
        }
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