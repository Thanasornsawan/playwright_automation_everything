const { test, expect, request } = require('@playwright/test');
const AuthPage = require('../../api/authPage');
const AdminPage = require('../../api/adminPage');
const UserProfilePage = require('../../api/userProfilePage');
const testData = require('../../data/api/admin_product_payload.json');

const BASE_URL = 'http://localhost:3000';

test.describe('Admin Authorization and Redirection Tests', () => {
    let apiContext;
    let authPage, adminPage, userProfilePage;
    let regularUserToken, adminToken;
    let testProductId;
    let regularUserId, adminUserId;

    test.beforeAll(async () => {
        apiContext = await request.newContext({
            extraHTTPHeaders: {
                'Accept': 'application/json'
            }
        });

        authPage = new AuthPage(apiContext, BASE_URL);
        adminPage = new AdminPage(apiContext, BASE_URL);
        userProfilePage = new UserProfilePage(apiContext, BASE_URL);

        // Create regular user with explicit non-admin flag
        const regularUser = authPage.generateTestUser(false);
        const regularRegisterResponse = await authPage.register(regularUser);
        regularUserId = regularRegisterResponse.userId;
        const regularLogin = await authPage.login({
            email: regularUser.email,
            password: regularUser.password
        });
        regularUserToken = regularLogin.token;
        expect(regularLogin.user.isAdmin).toBe(false);

        // Create admin user
        const { user: adminUser, response: adminResponse } = await authPage.registerAdmin();
        adminUserId = adminResponse.userId;
        const adminLogin = await authPage.login({
            email: adminUser.email,
            password: adminUser.password
        });
        adminToken = adminLogin.token;
        expect(adminLogin.user.isAdmin).toBe(true);

        const productResponse = await adminPage.createProduct(testData.authorize_product, adminToken);
        testProductId = productResponse.id;
    });

    test('should deny regular user access to admin product creation', async () => {
        const response = await adminPage.attemptUnauthorizedAccess(
            '/admin/products',
            regularUserToken,
            'POST',
            testData.unauthorize_product
        );

        // Check unauthorized response
        expect(response.status()).toBe(403);
        const responseData = await response.json();
        expect(responseData.error).toBe('Unauthorized access');
        expect(responseData.message).toBe('This endpoint requires admin privileges');
    });

    test('should deny regular user access to admin inventory', async () => {
        const response = await adminPage.attemptUnauthorizedAccess(
            '/admin/inventory',
            regularUserToken,
            'GET'
        );

        expect(response.status()).toBe(403);
        const responseData = await response.json();
        expect(responseData.error).toBe('Unauthorized access');
        expect(responseData.message).toBe('This endpoint requires admin privileges');
    });

    test('should handle expired token access attempts', async () => {
        const expiredToken = authPage.generateExpiredToken(adminUserId);
        
        const response = await adminPage.attemptUnauthorizedAccess(
            '/admin/inventory',
            expiredToken,
            'GET'
        );

        expect(response.status()).toBe(401);
        const responseData = await response.json();
        expect(responseData.error).toBe('Token expired');
    });

    test('should allow admin to access protected endpoints', async () => {
        const response = await adminPage.getInventory(adminToken);
        
        expect(response).toBeDefined();
        expect(response.lowStockItems).toBeDefined();
        expect(response.threshold).toBeDefined();
        expect(response.timestamp).toBeDefined();
    });

    test('should handle invalid tokens', async () => {
        const invalidTokens = [
            '',                    // Empty token
            'invalid.token.here',  // Malformed token
            authPage.generateExpiredToken(adminUserId), // Expired token
        ];

        for (const token of invalidTokens) {
            const response = await adminPage.attemptUnauthorizedAccess(
                '/admin/inventory',
                token,
                'GET'
            );

            expect(response.status()).toBe(401);
            const responseData = await response.json();
            expect(responseData.error).toBeTruthy();
        }
    });

    test.afterAll(async () => {
        try {
            if (testProductId) {
                console.log("Deleting test product...");
                await adminPage.deleteProduct(testProductId, adminToken);
            }
            if (regularUserId) {
                console.log("Deleting regular user...");
                await userProfilePage.deleteUser(regularUserId, adminToken);
            }
            if (adminUserId) {
                console.log("Deleting admin user...");
                await userProfilePage.deleteUser(adminUserId, adminToken);
            }
        } catch (error) {
            console.error('Cleanup error:', error);
            throw error;
        } finally {
            await apiContext.dispose();
        }
    });
});