const { test, expect, request } = require('@playwright/test');
const AuthPage = require('../../api/authPage');
const TransactionPage = require('../../api/XMLTransactionPage');
const UserProfilePage = require('../../api/userProfilePage');

const BASE_URL = 'http://localhost:3000';

test.describe('Advanced XML Processing Tests', () => {
    let apiContext;
    let authPage, transactionPage, userProfilePage;;
    let authToken, userId;

    test.beforeAll(async () => {
        // Initialize API context
        apiContext = await request.newContext({
            extraHTTPHeaders: {
                'Accept': 'application/json'
            }
        });

        // Initialize page objects
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

    test.describe('Complex XML Processing', () => {
        test('Filter High Priority Items', async () => {
            const testItems = [
                { 
                    id: '1', 
                    name: 'Critical Task', 
                    status: 'active', 
                    priority: 9,
                    metadata: { group: 'A', criticality: 'high' }
                },
                { 
                    id: '2', 
                    name: 'Low Priority Task', 
                    status: 'active', 
                    priority: 3,
                    metadata: { group: 'B', criticality: 'low' }
                }
            ];
    
            const response = await transactionPage.sendAdvancedXMLData(
                authToken, 
                'filter-high-priority', 
                testItems
            );
    
            expect(response.status()).toBe(200);
            
            const parsedResponse = await transactionPage.parseXMLResponse(await response.text());
            
            // Verify only high-priority items are returned
            expect(parsedResponse.response.items.item).toHaveLength(1);
            expect(parsedResponse.response.items.item[0].name).toBe('Critical Task');
            expect(parsedResponse.response.$.operation).toBe('filter-high-priority');
        });
    
        test('Transform Item Status', async () => {
            const testItems = [
                { 
                    id: '1', 
                    name: 'High Impact Task', 
                    status: 'pending', 
                    priority: 7,
                    metadata: { complexity: 'high' }
                },
                { 
                    id: '2', 
                    name: 'Low Impact Task', 
                    status: 'active', 
                    priority: 3,
                    metadata: { complexity: 'low' }
                }
            ];
    
            const response = await transactionPage.sendAdvancedXMLData(
                authToken, 
                'transform', 
                testItems
            );
    
            expect(response.status()).toBe(200);
            
            const parsedResponse = await transactionPage.parseXMLResponse(await response.text());
            
            // Verify status transformation
            const transformedItems = parsedResponse.response.items.item;
            expect(transformedItems).toHaveLength(2);
        
            // Check that high-priority item got 'critical' status
            const highPriorityItem = transformedItems.find(item => item.name === 'High Impact Task');
        
            expect(highPriorityItem).toBeDefined(); // Check attributes exist
            expect(highPriorityItem.status).toBe('critical');
        });
    
        test('Validate XML Items', async () => {
            const testItems = [
                { 
                    id: '1', 
                    name: 'Valid Task', 
                    status: 'active', 
                    priority: 5,
                    metadata: { valid: true }
                },
                { 
                    id: '2', 
                    name: '', // Invalid - missing name
                    status: 'pending', 
                    priority: 11, // Invalid - out of range
                    metadata: { valid: false }
                }
            ];
    
            const response = await transactionPage.sendAdvancedXMLData(
                authToken, 
                'validate', 
                testItems
            );
    
            expect(response.status()).toBe(400);
            
            const responseBody = await response.json();
            
            // Verify validation errors
            expect(responseBody.error).toBe('Validation failed');
            expect(responseBody.invalidItems).toHaveLength(1);
            expect(responseBody.invalidItems[0].id).toBe('2');
        });

        // Additional XML-specific test for content type and structure
        test('XML Content Type and Structure Validation', async () => {
            const testItems = [
                { 
                    id: '1', 
                    name: 'Sample Task', 
                    status: 'active', 
                    priority: 5,
                    metadata: { test: 'structure' }
                }
            ];

            const response = await transactionPage.sendAdvancedXMLData(
                authToken, 
                'validate', 
                testItems
            );

            // Validate response headers
            expect(response.headers()['content-type']).toContain('application/xml');

            // Parse the XML response
            const parsedResponse = await transactionPage.parseXMLResponse(await response.text());
            
            // Verify XML structure
            expect(parsedResponse.response).toBeDefined();
            expect(parsedResponse.response.$).toBeDefined();
            expect(parsedResponse.response.$.timestamp).toBeTruthy();
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