const { test, expect, request } = require('@playwright/test');
const AuthPage = require('../../api/authPage');
const UserProfilePage = require('../../api/userProfilePage');
const ProductsPage = require('../../api/productPage');
const OrdersPage = require('../../api/orderPage');

const BASE_URL = 'http://localhost:3000';

test.describe('Complex API Testing Suite', () => {
    let apiContext;
    let authPage, userProfilePage, productsPage, ordersPage;
    let authToken, userId, createdOrderId;
    let productIds = [];
    let reviewId;
    let firstProductId;

    test.beforeAll(async () => {
        // Create a new API request context
        apiContext = await request.newContext();
        
        // Initialize pages with the API context
        authPage = new AuthPage(apiContext, BASE_URL);
        userProfilePage = new UserProfilePage(apiContext, BASE_URL);
        productsPage = new ProductsPage(apiContext, BASE_URL);
        ordersPage = new OrdersPage(apiContext, BASE_URL);

        // Register and login
        const user = authPage.generateTestUser();
        const registerData = await authPage.register(user);
        userId = registerData.userId;

        const loginData = await authPage.login({
            email: user.email,
            password: user.password
        });
        authToken = loginData.token;

        // Setup products and review
        await productsPage.seedProducts(authToken);
        const products = await productsPage.getProducts(authToken);
        
        expect(Array.isArray(products)).toBeTruthy();
        expect(products.length).toBeGreaterThan(0);
        
        productIds = products.slice(0, 2).map((p) => p.id);
        firstProductId = productIds[0];

        const review = await productsPage.createReview(
            firstProductId,
            {
                rating: 4,
                comment: 'Initial comment for the product review'
            },
            authToken
        );
        reviewId = review.id;
    });

    test('should create and verify user profile', async () => {
        const profileData = {
            phoneNumber: '+1234567890',
            address: '123 Test St',
            preferences: { notifications: true },
        };

        await userProfilePage.createProfile(userId, profileData, authToken);
        const retrievedProfile = await userProfilePage.getProfile(userId, authToken);
        expect(retrievedProfile).toMatchObject(profileData);
    });

    test('should create and process an order', async () => {
        const orderData = {
            items: productIds.map((productId) => ({
                productId,
                quantity: 1,
            })),
        };

        const order = await ordersPage.createOrder(orderData, authToken);
        createdOrderId = order.json.id;
        expect(order.json.UserId).toBe(userId);

        const orderStatus = await ordersPage.getOrder(createdOrderId, authToken);
        expect(orderStatus.status).toBe('pending');
    });

    test('should update order status to shipped (PATCH)', async () => {
        const updatedOrder = await ordersPage.updateOrderStatus(createdOrderId, 'shipped', authToken);
        expect(updatedOrder.status).toBe('shipped');
    });

    test('should update product review (PUT)', async () => {
        const updatedReview = await productsPage.updateReview(
            firstProductId,
            reviewId,
            {
                rating: 5,
                comment: 'Updated comment for the product review'
            },
            authToken
        );
        expect(updatedReview.comment).toBe('Updated comment for the product review');
    });

    test('should handle error scenarios', async () => {
        // Create a new request context for error testing
        const errorContext = await request.newContext();

        await test.step('should handle invalid token to get user profile with status code 401', async () => {
            const invalidResponse = await errorContext.get(
                `${BASE_URL}/users/${userId}/profile`,
                {
                    headers: { Authorization: 'Bearer invalid_token' },
                }
            );
            expect(invalidResponse.status()).toBe(401);
        });

        await test.step('should handle invalid produc id with status code 404', async () => {
            const fakeUuid = crypto.randomUUID();
            const notFoundResponse = await errorContext.get(
                `${BASE_URL}/products/${fakeUuid}`,
                {
                    headers: authPage.getAuthHeaders(authToken),
                }
            );
            expect(notFoundResponse.status()).toBe(404);
        });

        await test.step('Invalid order: No items provided with status code 400', async () => {
            const invalidOrderResponse = await ordersPage.createOrder({ items: [] }, authToken);
            expect(invalidOrderResponse.status).toBe(400);
            expect(invalidOrderResponse.json.error).toBe('Invalid order: No items provided');

       });
        // Dispose of the error testing context
        await errorContext.dispose();
    });

    test.afterAll(async () => {
        test.setTimeout(60000); // Set timeout for the afterAll hook
        try {
            console.log("Deleting all reviews from setup...");
            await productsPage.deleteAllReviews(authToken);
            console.log("Deleted all reviews completed");
            if (createdOrderId) {
                console.log("Deleting order items and order from setup...");
                await ordersPage.deleteOrderItems(createdOrderId, authToken);
                await ordersPage.deleteOrder(createdOrderId, authToken);
                console.log("Deleted order items and order completed");
            }
            console.log("Deleting user from setup...");
            await userProfilePage.deleteUser(userId, authToken);
            console.log("Deleted user completed");
        } catch (error) {
            console.error('Cleanup error:', error);
            throw error;
        } finally {
            // Dispose of the main API context
            await apiContext.dispose();
        }
    });

});