const { test, expect } = require('@playwright/test');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:3000';

test.describe('Complex API Testing Suite', () => {
  let authToken, userId, createdOrderId;
  let productIds = [];
  let reviewId;
  let firstProductId;

  const generateTestUser = () => ({
    email: `test.user.${crypto.randomUUID()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
  });

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  });

  const validateResponse = async (response, expectedStatus) => {
    if (response.status() !== expectedStatus) {
      const errorBody = await response.json().catch(() => ({}));
      console.error('Error response:', errorBody);
    }
    expect(response.status()).toBe(expectedStatus);
    const body = await response.json();
    return body;
  };

  test.beforeAll(async ({ request }) => {
    const user = generateTestUser();
    const registerResponse = await request.post(`${BASE_URL}/auth/register`, {
      data: user,
      headers: { 'Content-Type': 'application/json' },
    });
    const registerData = await validateResponse(registerResponse, 201);
    
    userId = registerData.userId;
    
    const loginResponse = await request.post(`${BASE_URL}/auth/login`, {
      data: { email: user.email, password: user.password },
      headers: { 'Content-Type': 'application/json' },
    });
    const loginData = await validateResponse(loginResponse, 200);
    authToken = loginData.token;

    const createProductsResponse = await request.post(`${BASE_URL}/products/seed`, {
      headers: getAuthHeaders(),
    });
    
    const productsResponse = await request.get(`${BASE_URL}/products`, {
      headers: getAuthHeaders(),
    });
    const products = await validateResponse(productsResponse, 200);
    expect(Array.isArray(products)).toBeTruthy();
    expect(products.length).toBeGreaterThan(0);
    
    productIds = products.slice(0, 2).map((p) => p.id);
    firstProductId = productIds[0];
    
    const reviewResponse = await request.post(`${BASE_URL}/products/${firstProductId}/reviews`, {
      headers: getAuthHeaders(),
      data: {
        rating: 4,
        comment: 'Initial comment for the product review',
      },
    });
    
    expect(reviewResponse.status()).toBe(201);
    const review = await reviewResponse.json();
    reviewId = review.id;
  });

  test('should create and verify user profile', async ({ request }) => {
    const profileData = {
      phoneNumber: '+1234567890',
      address: '123 Test St',
      preferences: { notifications: true },
    };
  
    const createProfileResponse = await request.post(
      `${BASE_URL}/users/${userId}/profile`,
      {
        data: profileData,
        headers: getAuthHeaders(),
      }
    );
    await validateResponse(createProfileResponse, 201);
  
    const getProfileResponse = await request.get(
      `${BASE_URL}/users/${userId}/profile`,
      {
        headers: getAuthHeaders(),
      }
    );
    const retrievedProfile = await validateResponse(getProfileResponse, 200);
    expect(retrievedProfile).toMatchObject(profileData);
  });

  test('should create and process an order', async ({ request }) => {
    const orderData = {
      items: productIds.map((productId) => ({
        productId,
        quantity: 1,
      })),
    };
  
    const createOrderResponse = await request.post(`${BASE_URL}/orders`, {
      data: orderData,
      headers: getAuthHeaders(),
    });
   
    const order = await validateResponse(createOrderResponse, 201);
    createdOrderId = order.id;
    
    expect(order.UserId).toBe(userId);
  
    const orderStatusResponse = await request.get(
      `${BASE_URL}/orders/${createdOrderId}`,
      {
        headers: getAuthHeaders(),
      }
    );
    
    const orderStatus = await validateResponse(orderStatusResponse, 200);
    expect(orderStatus.status).toBe('pending');
  });

  test('should update order status to shipped (PATCH)', async ({ request }) => {
    const patchOrderResponse = await request.patch(
      `${BASE_URL}/orders/${createdOrderId}`,
      {
        data: { status: 'shipped' },
        headers: getAuthHeaders(),
      }
    );
    
    const updatedOrder = await validateResponse(patchOrderResponse, 200);
    expect(updatedOrder.status).toBe('shipped');
  });

  test('should update product review (PUT)', async ({ request }) => {
    const updateReviewResponse = await request.put(
      `${BASE_URL}/products/${firstProductId}/reviews/${reviewId}`,
      {
        data: { 
          rating: 5, 
          comment: 'Updated comment for the product review' 
        },
        headers: getAuthHeaders(),
      }
    );
    
    const updatedReview = await validateResponse(updateReviewResponse, 200);
    expect(updatedReview.comment).toBe('Updated comment for the product review');
  });

  test('should handle error scenarios', async ({ request }) => {
    const invalidResponse = await request.get(
      `${BASE_URL}/users/${userId}/profile`,
      {
        headers: { Authorization: 'Bearer invalid_token' },
      }
    );
    expect(invalidResponse.status()).toBe(401);

    const fakeUuid = crypto.randomUUID();
    const notFoundResponse = await request.get(
      `${BASE_URL}/products/${fakeUuid}`,
      {
        headers: getAuthHeaders(),
      }
    );
    expect(notFoundResponse.status()).toBe(404);

    const invalidOrderResponse = await request.post(`${BASE_URL}/orders`, {
      data: { items: [] },
      headers: getAuthHeaders(),
    });
    expect(invalidOrderResponse.status()).toBe(400);
  });

  test.afterAll(async ({ request }) => {
    try {
      if (createdOrderId) {
        await request.delete(
          `${BASE_URL}/orders/${createdOrderId}/items`,
          {
            headers: getAuthHeaders(),
          }
        );
  
        await request.delete(
          `${BASE_URL}/orders/${createdOrderId}`,
          {
            headers: getAuthHeaders(),
          }
        );
      }
      
      const deleteUserResponse = await request.delete(
        `${BASE_URL}/users/${userId}`,
        {
          headers: getAuthHeaders(),
        }
      );
      expect(deleteUserResponse.status()).toBe(200);
    } catch (error) {
      console.error('Cleanup error:', error);
      throw error;
    }
  });
});