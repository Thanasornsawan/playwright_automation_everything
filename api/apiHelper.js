const { expect } = require('@playwright/test');

class ApiHelper {
    constructor(request, baseUrl) {
        this.request = request;
        this.baseUrl = baseUrl;
    }

    getAuthHeaders(token) {
        return {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    }

    async validateResponse(response, expectedStatus) {
        if (response.status() !== expectedStatus) {
            const errorBody = await response.json().catch(() => ({}));
            console.error('Error response:', errorBody);
        }
        expect(response.status()).toBe(expectedStatus);
        return await response.json();
    }
}

module.exports = ApiHelper;