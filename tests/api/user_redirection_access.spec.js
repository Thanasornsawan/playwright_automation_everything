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

        // Create test product
        const productResponse = await adminPage.createProduct(testData.authorize_product, adminToken);
        testProductId = productResponse.id;
    });

    test.describe('Authentication Failures (401)', () => {
        test('should return 401 for unauthenticated access without redirect header', async () => {
            const response = await apiContext.get(`${BASE_URL}/admin/inventory`, {
                headers: { 
                    'Accept': 'application/json'
                }
            });
            
            expect(response.status()).toBe(401);
            expect(await response.json()).toMatchObject({
                error: 'Missing token'
            });
        });

        test('should return 401 for invalid token format', async () => {
            const response = await apiContext.get(`${BASE_URL}/admin/inventory`, {
                headers: { 
                    'Authorization': 'Bearer invalid.token.format',
                    'Accept': 'application/json'
                }
            });
            
            expect(response.status()).toBe(401);
            const errorData = await response.json();
            expect(errorData.error).toBe('Invalid token');
        });

        test('should return 401 for expired token', async () => {
            const expiredToken = authPage.generateExpiredToken(adminUserId);
            
            const response = await apiContext.get(`${BASE_URL}/admin/inventory`, {
                headers: { 
                    'Authorization': `Bearer ${expiredToken}`,
                    'Accept': 'application/json'
                }
            });
            
            expect(response.status()).toBe(401);
            const errorData = await response.json();
            expect(errorData.error).toBe('Token expired');
        });
    });

    test.describe('Authorization Failures (403)', () => {
        test('should return 403 for non-admin access without redirect header', async () => {
            const response = await apiContext.get(`${BASE_URL}/admin/inventory`, {
                headers: { 
                    'Authorization': `Bearer ${regularUserToken}`,
                    'Accept': 'application/json'
                }
            });
            
            expect(response.status()).toBe(403);
            expect(await response.json()).toMatchObject({
                error: 'Unauthorized access',
                message: 'This endpoint requires admin privileges'
            });
        });

        test('should return 403 when regular user attempts admin operations', async () => {
            const testOperations = [
                {
                    method: 'POST',
                    path: '/admin/products',
                    data: testData.unauthorize_product
                },
                {
                    method: 'PUT',
                    path: `/admin/products/${testProductId}`,
                    data: {
                        stock: 100
                    }
                },
                {
                    method: 'DELETE',
                    path: `/admin/products/${testProductId}`
                }
            ];

            for (const operation of testOperations) {
                const response = await apiContext[operation.method.toLowerCase()](`${BASE_URL}${operation.path}`, {
                    headers: { 
                        'Authorization': `Bearer ${regularUserToken}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    data: operation.data
                });
                
                expect(response.status()).toBe(403);
                const errorData = await response.json();
                expect(errorData.error).toBe('Unauthorized access');
                expect(errorData.message).toBe('This endpoint requires admin privileges');
            }
        });
    });

    test.describe('Redirection Scenarios (302)', () => {
        
        test('should redirect to login page for unauthenticated access', async () => {
            // Create a new context without any default headers
            const cleanContext = await request.newContext();
            
            try {
                // Make request with only the redirect header and ensure it's a fresh request
                const response = await cleanContext.get(`${BASE_URL}/admin/inventory`, {
                    headers: { 
                        'Accept': 'application/json',
                        'X-Handle-Redirect': 'true'
                    },
                    followRedirects: false,
                    maxRedirects: 0
                });
        
                const responseHeaders = await response.headers();
                const responseStatus = response.status();
        
                // Verify redirect
                expect(responseStatus).toBe(302);
                expect(responseHeaders['location']).toBe('/auth/login');
        
                // Follow redirect manually
                if (responseHeaders['location']) {
                    const loginResponse = await cleanContext.get(
                        `${BASE_URL}${responseHeaders['location']}`,
                        {
                            headers: { 'Accept': 'application/json' }
                        }
                    );
        
                    expect(loginResponse.status()).toBe(200);
                    const loginData = await loginResponse.json();
                    expect(loginData.message).toBe('Please login to continue');
                    expect(loginData.redirected).toBe(true);
                }
            } finally {
                await cleanContext.dispose();
            }
        });
    
        test('should redirect to unauthorized page for non-admin access with redirection enabled', async () => {
            // Create a new context for this test
            const cleanContext = await request.newContext();
            
            try {
                // First request - expect redirect
                const response = await cleanContext.get(`${BASE_URL}/admin/inventory`, {
                    headers: { 
                        'Authorization': `Bearer ${regularUserToken}`,
                        'Accept': 'application/json',
                        'X-Handle-Redirect': 'true'
                    },
                    followRedirects: false,
                    maxRedirects: 0
                });
        
                const responseHeaders = await response.headers();
                const responseStatus = response.status();
                
                // Check redirect status and location
                expect(responseStatus).toBe(302);
                expect(responseHeaders['location']).toBe('/auth/unauthorized');
        
                // Follow redirect manually
                if (responseHeaders['location']) {
                    const unauthorizedResponse = await cleanContext.get(
                        `${BASE_URL}${responseHeaders['location']}`,
                        {
                            headers: { 
                                'Accept': 'application/json',
                                'Authorization': `Bearer ${regularUserToken}`
                            }
                        }
                    );
        
                    // Verify unauthorized page response
                    expect(unauthorizedResponse.status()).toBe(403);
                    const errorData = await unauthorizedResponse.json();
                    expect(errorData.error).toBe('Unauthorized access');
                    expect(errorData.message).toBe('This endpoint requires admin privileges');
                    expect(errorData.redirected).toBe(true);
                }
            } finally {
                await cleanContext.dispose();
            }
        });
    });

    test.describe('Successful Admin Access (200)', () => {
        test('should allow admin to access protected endpoints', async () => {
            const response = await apiContext.get(`${BASE_URL}/admin/inventory`, {
                headers: { 
                    'Authorization': `Bearer ${adminToken}`,
                    'Accept': 'application/json'
                }
            });
            
            expect(response.status()).toBe(200);
            const data = await response.json();
            expect(data.lowStockItems).toBeDefined();
            expect(data.threshold).toBeDefined();
        });
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