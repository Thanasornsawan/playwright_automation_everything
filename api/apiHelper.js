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
        // Don't log error response for expected error status codes
        if (response.status() !== expectedStatus && 
            !(expectedStatus >= 400 && response.status() === expectedStatus)) {
            const errorBody = await response.json().catch(() => ({}));
            console.error('Error response:', errorBody);
        }
        
        expect(response.status()).toBe(expectedStatus);

        // Don't try to parse JSON for 204 No Content responses
        if (expectedStatus === 204) {
            return null;
        }

        try {
            return await response.json();
        } catch (error) {
            if (expectedStatus !== 204) {
                console.error('Error parsing JSON response:', error);
                throw error;
            }
            return null;
        }
    }
}

module.exports = ApiHelper;