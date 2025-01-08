const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const ApiHelper = require('./apiHelper');

class AuthPage extends ApiHelper {
    generateTestUser(isAdmin = false) {
        return {
            email: `test.user.${crypto.randomUUID()}@example.com`,
            password: 'TestPassword123!',
            firstName: 'Test',
            lastName: 'User',
            isAdmin
        };
    }

    async register(userData) {
        const response = await this.request.post(`${this.baseUrl}/auth/register`, {
            data: userData,
            headers: { 'Content-Type': 'application/json' },
        });
        return this.validateResponse(response, 201);
    }

    async registerAdmin() {
        const adminUser = this.generateTestUser(true);
        const response = await this.register(adminUser);
        return {
            user: adminUser,
            response
        };
    }

    async login(credentials) {
        const response = await this.request.post(`${this.baseUrl}/auth/login`, {
            data: credentials,
            headers: { 'Content-Type': 'application/json' },
        });
        return this.validateResponse(response, 200);
    }

    generateExpiredToken(userId = '1', secret = process.env.JWT_SECRET) {
        const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
        const payload = {
            userId,
            iat: oneHourAgo - 3600,
            exp: oneHourAgo
        };
        return jwt.sign(payload, secret);
    }
}

module.exports = AuthPage;