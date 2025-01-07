const ApiHelper = require('./apiHelper');

class ProductsPage extends ApiHelper {
    async seedProducts(token) {
        const response = await this.request.post(
            `${this.baseUrl}/products/seed`,
            {
                headers: this.getAuthHeaders(token),
            }
        );
        return this.validateResponse(response, 201);
    }

    async getProducts(token) {
        const response = await this.request.get(
            `${this.baseUrl}/products`,
            {
                headers: this.getAuthHeaders(token),
            }
        );
        return this.validateResponse(response, 200);
    }

    async createReview(productId, reviewData, token) {
        const response = await this.request.post(
            `${this.baseUrl}/products/${productId}/reviews`,
            {
                data: reviewData,
                headers: this.getAuthHeaders(token),
            }
        );
        return this.validateResponse(response, 201);
    }

    async updateReview(productId, reviewId, reviewData, token) {
        const response = await this.request.put(
            `${this.baseUrl}/products/${productId}/reviews/${reviewId}`,
            {
                data: reviewData,
                headers: this.getAuthHeaders(token),
            }
        );
        return this.validateResponse(response, 200);
    }

    async deleteAllReviews(token) {
        const response = await this.request.delete(
            `${this.baseUrl}/reviews`, 
            {
                headers: this.getAuthHeaders(token),
            }
        );
        return this.validateResponse(response, 200);
    }
}

module.exports = ProductsPage;