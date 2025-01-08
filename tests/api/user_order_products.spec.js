const { test, expect, request } = require('@playwright/test');
const AuthPage = require('../../api/authPage');
const UserProfilePage = require('../../api/userProfilePage');
const ProductsPage = require('../../api/productPage');
const OrdersPage = require('../../api/orderPage');
const userData = require('../../data/api/user_profile_payload.json');
const reviewData = require('../../data/api/product_review_payload.json');

const BASE_URL = 'http://localhost:3000';

test.describe('Verify API method with order products and user profile', () => {
    let apiContext;
    let authPage, userProfilePage, productsPage, ordersPage;
    let authToken, userId, createdOrderId;
    let productIds = [];
    let reviewId;
    let firstProductId;

    test.beforeAll(async () => {
        apiContext = await request.newContext();
        
        authPage = new AuthPage(apiContext, BASE_URL);
        userProfilePage = new UserProfilePage(apiContext, BASE_URL);
        productsPage = new ProductsPage(apiContext, BASE_URL);
        ordersPage = new OrdersPage(apiContext, BASE_URL);

        // Register and login regular user
        const user = authPage.generateTestUser(false);
        const registerData = await authPage.register(user);
        userId = registerData.userId;

        const loginData = await authPage.login({
            email: user.email,
            password: user.password
        });
        authToken = loginData.token;
        expect(loginData.user.isAdmin).toBe(false);

        // Setup products
        await productsPage.seedProducts(authToken);
        const products = await productsPage.getProducts(authToken);
        
        expect(Array.isArray(products)).toBeTruthy();
        expect(products.length).toBeGreaterThan(0);
        
        productIds = products.slice(0, 2).map((p) => p.id);
        firstProductId = productIds[0];

        // Create initial review using test data
        const review = await productsPage.createReview(
            firstProductId,
            reviewData.initial,
            authToken
        );
        reviewId = review.id;
    });

    test('should create and verify user profile', async () => {
        await userProfilePage.createProfile(userId, userData.profile, authToken);
        const retrievedProfile = await userProfilePage.getProfile(userId, authToken);
        expect(retrievedProfile).toMatchObject(userData.profile);
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
            reviewData.updated,
            authToken
        );
        expect(updatedReview.comment).toBe(reviewData.updated.comment);
    });

    test('should handle error scenarios', async () => {
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

        await test.step('should handle expired token with status code 401', async () => {
            const expiredToken = authPage.generateExpiredToken(userId);
            const expiredResponse = await errorContext.get(
                `${BASE_URL}/users/${userId}/profile`,
                {
                    headers: { Authorization: `Bearer ${expiredToken}` },
                }
            );
            expect(expiredResponse.status()).toBe(401);
        });

        await test.step('should handle invalid product id with status code 404', async () => {
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