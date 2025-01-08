const { test, expect, request } = require('@playwright/test');
const AuthPage = require('../../api/authPage');
const AdminPage = require('../../api/adminPage');
const UserProfilePage = require('../../api/userProfilePage');
const testData = require('../../data/api/threshold_product_payload.json');

const BASE_URL = 'http://localhost:3000';

test.describe('Admin Inventory Management', () => {
    let apiContext;
    let authPage, adminPage, userProfilePage;
    let adminToken;
    let testProducts = [];
    let adminUserId;

    test.beforeAll(async () => {
        apiContext = await request.newContext({
            extraHTTPHeaders: {
                'Accept': 'application/json'
            }
        });

        authPage = new AuthPage(apiContext, BASE_URL);
        adminPage = new AdminPage(apiContext, BASE_URL);
        userProfilePage = new UserProfilePage(apiContext, BASE_URL);

        // Create admin user and get token
        const { user: adminUser, response: adminResponse } = await authPage.registerAdmin();
        adminUserId = adminResponse.userId;
        const adminLogin = await authPage.login({
            email: adminUser.email,
            password: adminUser.password
        });
        adminToken = adminLogin.token;

        const createdProducts = await adminPage.createProduct(testData.products, adminToken);
        testProducts = createdProducts;
    });

    test('should get low stock items with default threshold', async () => {
        const response = await adminPage.getInventory(adminToken);
        
        expect(response.threshold).toBe(10);
        expect(response.lowStockItems).toHaveLength(2);
        expect(response.message).toContain('Found 2 products below stock threshold of 10');
    });

    test('should get low stock items with custom threshold', async () => {
        const response = await adminPage.getInventory(adminToken, 6);
        
        expect(response.threshold).toBe(6);
        expect(response.lowStockItems).toHaveLength(1);
        expect(response.message).toContain('Found 1 products below stock threshold of 6');
    });

    test('should handle no items below threshold', async () => {
        const response = await adminPage.getInventory(adminToken, 3);
        
        expect(response.lowStockItems).toHaveLength(0);
        expect(response.message).toContain('No products found below stock threshold of 3');
    });

    test('should handle invalid threshold', async () => {
        const response = await adminPage.getInventory(adminToken, -1);
        
        expect(response.error).toBe('Invalid threshold');
        expect(response.message).toBe('Threshold must be a positive number');
        expect(response.timestamp).toBeDefined();
    });

    test.afterAll(async () => {
        try {
            // Clean up test products
            console.log("Cleaning up test products...");
            for (const product of testProducts) {
                await adminPage.deleteProduct(product.id, adminToken);
            }
            
            // Clean up admin user
            if (adminUserId) {
                console.log("Cleaning up admin user...");
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