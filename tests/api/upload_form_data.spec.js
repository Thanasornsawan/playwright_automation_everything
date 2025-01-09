const { test, expect, request } = require('@playwright/test');
const path = require('path');
const AuthPage = require('../../api/authPage');
const TransactionPage = require('../../api/formImageTransactionPage');
const UserProfilePage = require('../../api/userProfilePage');

const BASE_URL = 'http://localhost:3000';

test.describe('Upload and Form Data Validation Tests', () => {
    let apiContext;
    let authPage, transactionPage, userProfilePage;
    let authToken, userId;

    test.beforeAll(async () => {
        // Initialize API context
        apiContext = await request.newContext({
            extraHTTPHeaders: {
                'Accept': 'application/json'
            }
        });

        authPage = new AuthPage(apiContext, BASE_URL);
        userProfilePage = new UserProfilePage(apiContext, BASE_URL);
        transactionPage = new TransactionPage(apiContext, BASE_URL);

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
    });

    test.describe('Image Upload Tests', () => {
        test('Upload Valid Image', async () => {
            const testImagePath = path.join(__dirname, '../../data/images/small_image.jpg');
            
            const response = await transactionPage.uploadImage(authToken, testImagePath);
            
            expect(response.status()).toBe(200);
            const responseBody = await response.json();
            
            expect(responseBody.message).toBe('Image uploaded successfully');
            expect(responseBody.dimensions).toBeDefined();
            expect(responseBody.mimeType).toBeTruthy();
        });

        test('Upload Image with Invalid File Type', async () => {
            const testImagePath = path.join(__dirname, '../../data/images/invalid_image.txt');
            
            const response = await transactionPage.uploadImage(authToken, testImagePath);
            
            expect(response.status()).toBe(400);
            const responseBody = await response.json();
            expect(responseBody.error).toBe('Invalid file type');
        });

        test('Upload Large Image Exceeding Size Limit', async () => {
            const testImagePath = path.join(__dirname, '../../data/images/large_image.jpg');
            
            const response = await transactionPage.uploadImage(authToken, testImagePath);
            
            expect(response.status()).toBe(400);
            const responseBody = await response.json();
            expect(responseBody.error).toContain('Image dimensions too large');
        });
    });

    test.describe('Form Data Validation Tests', () => {
        test('Submit Valid Form Data', async () => {
            const testData = {
                username: 'johndoe',
                email: 'john.doe@example.com',
                age: '30'
            };

            const response = await transactionPage.sendFormData(authToken, testData);
            
            expect(response.status()).toBe(200);
            const responseBody = await response.json();
            
            expect(responseBody.message).toBe('Form data received successfully');
            expect(responseBody.data.username).toBe('johndoe');
            expect(responseBody.data.email).toBe('john.doe@example.com');
            expect(responseBody.data.age).toBe(30);
        });

        test('Submit Form Data with Invalid Username', async () => {
            const testData = {
                username: 'jo',  // Too short
                email: 'john.doe@example.com',
                age: '30'
            };

            const response = await transactionPage.sendFormData(authToken, testData);
            
            expect(response.status()).toBe(400);
            const responseBody = await response.json();
            expect(responseBody.errors).toContain('Username must be at least 3 characters');
        });

        test('Submit Form Data with Invalid Email', async () => {
            const testData = {
                username: 'johndoe',
                email: 'invalid-email',  // Invalid email format
                age: '30'
            };

            const response = await transactionPage.sendFormData(authToken, testData);
            
            expect(response.status()).toBe(400);
            const responseBody = await response.json();
            expect(responseBody.errors).toContain('Invalid email format');
        });

        test('Submit Form Data with Invalid Age', async () => {
            const testData = {
                username: 'johndoe',
                email: 'john.doe@example.com',
                age: '10'  // Age below valid range
            };

            const response = await transactionPage.sendFormData(authToken, testData);
            
            expect(response.status()).toBe(400);
            const responseBody = await response.json();
            expect(responseBody.errors).toContain('Invalid age (must be between 18 and 120)');
        });
    });

    test.afterAll(async () => {
        try {
            await userProfilePage.deleteUser(userId, authToken);
        } catch (error) {
            console.error('Cleanup error:', error);
            throw error;
        } finally {
            await apiContext.dispose();
        }
    });
});