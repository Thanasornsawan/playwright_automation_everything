const ApiHelper = require('./apiHelper');

class AdminPage extends ApiHelper {
    constructor(request, baseUrl) {
        super(request, baseUrl);
    }

    async createProduct(productData, token) {
        // If it's an array of products, create them one by one
        if (Array.isArray(productData)) {
            const currentTimestamp = new Date();
            const createdProducts = [];
            
            for (const product of productData) {
                const response = await this.request.post(`${this.baseUrl}/admin/products`, {
                    data: {
                        ...product,
                        createdAt: currentTimestamp,
                        updatedAt: currentTimestamp
                    },
                    headers: this.getAuthHeaders(token),
                });
                const createdProduct = await this.validateResponse(response, 201);
                createdProducts.push(createdProduct);
            }
            return createdProducts;
        }

        // Single product creation
        const currentTimestamp = new Date();
        const response = await this.request.post(`${this.baseUrl}/admin/products`, {
            data: {
                ...productData,
                createdAt: currentTimestamp,
                updatedAt: currentTimestamp
            },
            headers: this.getAuthHeaders(token),
        });
        return this.validateResponse(response, 201);
    }

    async deleteProduct(productId, token) {
        const response = await this.request.delete(`${this.baseUrl}/admin/products/${productId}`, {
            headers: this.getAuthHeaders(token),
        });
        // Don't try to use the response for 204
        await this.validateResponse(response, 204);
        return true; // Indicate successful deletion
    }

    async getInventory(token, threshold = null) {
        const queryParams = threshold !== null ? `?threshold=${threshold}` : '';
        const response = await this.request.get(
            `${this.baseUrl}/admin/inventory${queryParams}`,
            {
                headers: this.getAuthHeaders(token),
            }
        );
        
        // For invalid threshold, we expect 400
        if (threshold !== null && threshold < 0) {
            return this.validateResponse(response, 400);
        }
        
        return this.validateResponse(response, 200);
    }

    async attemptUnauthorizedAccess(endpoint, token, method = 'GET', data = null) {
        const options = {
            headers: this.getAuthHeaders(token)
        };

        if (data) {
            options.data = data;
        }

        const response = await this.request[method.toLowerCase()](`${this.baseUrl}${endpoint}`, options);
        return response;
    }
}

module.exports = AdminPage;