const SearchPage = require('../../pages/tool_shop/searchPage');
const ProductDetailPage = require('../../pages/tool_shop/productDetailPage');

class ProductFeature {
    constructor(page, baseURL) {
        this.page = page;
        this.baseURL = baseURL;
    }

    /**
     * Add a product to cart and return its details
     * @param {Object} params - Parameters for adding product
     * @param {string} params.productName - Name of product to search for
     * @param {number} [params.quantity=1] - Quantity to add (default: 1)
     * @returns {Promise<{name: string, price: number}>} Product details
     */
    async addProductToCart(params) {
        const searchPage = new SearchPage(this.page, this.baseURL);
        const productDetailPage = new ProductDetailPage(this.page, this.baseURL);
    
        // Search and navigate to product
        await searchPage.search(params.productName);
        // Find the exact product we want
        const allProducts = await searchPage.productNames.allInnerTexts();
        const exactProductIndex = allProducts.findIndex(name => 
            name.toLowerCase().includes(params.productName.toLowerCase())
        );
        
        if (exactProductIndex === -1) {
            throw new Error(`Product "${params.productName}" not found in search results`);
        }

        // Click the specific product we want
        await searchPage.searchResults.nth(exactProductIndex).click();

        // Get product details
        const name = await productDetailPage.productName.innerText();
        const price = parseFloat((await productDetailPage.productPrice.innerText()).replace('$', ''));
        
        // Add to cart with specified quantity
        if (params.quantity && params.quantity > 1) {
            await productDetailPage.increaseQuantity(params.quantity - 1);
        }
        await productDetailPage.addToCart();

        // Get the actual quantity that was added
        const currentQuantity = await productDetailPage.getCurrentQuantity();

        return { 
            name, 
            price,
            initialQuantity: currentQuantity 
        };
    }

    /**
     * Add multiple products to cart
     * @param {Array<{productName: string, quantity?: number}>} products - Array of products to add
     * @returns {Promise<Array<{name: string, price: number}>>} Array of added products' details
     */
    async addMultipleProductsToCart(products) {
        const addedProducts = [];

        for (const product of products) {
            // Navigate back to home before each product
            await this.page.goto(this.baseURL);
            
            const productDetails = await this.addProductToCart({
                productName: product.productName,
                quantity: product.quantity || 1
            });
            addedProducts.push(productDetails);
        }

        return addedProducts;
    }
}

module.exports = ProductFeature;