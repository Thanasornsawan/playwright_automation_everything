const ApiHelper = require('./apiHelper');

class OrdersPage extends ApiHelper {
    async createOrder(orderData, token) {
        const response = await this.request.post(
            `${this.baseUrl}/orders`,
            {
                data: orderData,
                headers: this.getAuthHeaders(token),
            }
        );

        // Extract the status as a plain value
        const status = response.status(); // Force evaluation of status to a number
        // Check status and parse JSON only if necessary
        let json;
        try {
            json = await response.json(); // Safely parse JSON
        } catch (error) {
            json = null; // Handle cases where the response body is empty or invalid
        }

        return { status, json };
    }

    async getOrder(orderId, token) {
        const response = await this.request.get(
            `${this.baseUrl}/orders/${orderId}`,
            {
                headers: this.getAuthHeaders(token),
            }
        );
        return this.validateResponse(response, 200);
    }

    async updateOrderStatus(orderId, status, token) {
        const response = await this.request.patch(
            `${this.baseUrl}/orders/${orderId}`,
            {
                data: { status },
                headers: this.getAuthHeaders(token),
            }
        );
        return this.validateResponse(response, 200);
    }

    async deleteOrderItems(orderId, token) {
        const response = await this.request.delete(
            `${this.baseUrl}/orders/${orderId}/items`,
            {
                headers: this.getAuthHeaders(token),
            }
        );
        return this.validateResponse(response, 200);
    }

    async deleteOrder(orderId, token) {
        const response = await this.request.delete(
            `${this.baseUrl}/orders/${orderId}`,
            {
                headers: this.getAuthHeaders(token),
            }
        );
        return this.validateResponse(response, 200);
    }
}

module.exports = OrdersPage;