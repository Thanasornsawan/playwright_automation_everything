const crypto = require('crypto');
const ApiHelper = require('./apiHelper');

class AuthPage extends ApiHelper {
    generateTestUser() {
        return {
            email: `test.user.${crypto.randomUUID()}@example.com`,
            password: 'TestPassword123!',
            firstName: 'Test',
            lastName: 'User',
        };
    }

    async register(userData) {
        const response = await this.request.post(`${this.baseUrl}/auth/register`, {
            data: userData,
            headers: { 'Content-Type': 'application/json' },
        });
        return this.validateResponse(response, 201);
    }

    async login(credentials) {
        const response = await this.request.post(`${this.baseUrl}/auth/login`, {
            data: credentials,
            headers: { 'Content-Type': 'application/json' },
        });
        return this.validateResponse(response, 200);
    }
}

module.exports = AuthPage;