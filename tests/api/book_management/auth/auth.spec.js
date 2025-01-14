const { test, expect } = require('@playwright/test');
const { setupTestAPI, bookPayload } = require('../utils/test.setup');
const { GET_BOOK } = require('../../../../data/api/queries/getBook');
const { CREATE_BOOK } = require('../../../../data/api/queries/createBook');

test.describe('Authentication and Authorization', () => {
    let bookAPI;

    test.beforeEach(async ({ request }) => {
        bookAPI = await setupTestAPI(request);
    });

    test('invalid API key', { tag: ['@smoke', '@auth' ] }, async () => {
        bookAPI.setApiKey('invalid-api-key');
        await expect(bookAPI.getBook({ bookId: '1' }))
            .rejects.toMatchObject({
                message: 'Invalid API key',
                code: 'FORBIDDEN'
            });
    });

    test('read-only permissions', { tag: ['@smoke', '@auth' ] }, async () => {
        bookAPI.setApiKey('test-api-key-readonly');
        
        // Read operation should succeed
        // method 1: without status code return
        /*
        const book = await bookAPI.getBook({ bookId: '1' });
        expect(book).toBeDefined();
        */

        // method 2: with status code return
        const getResponse = await bookAPI.sendQuery(GET_BOOK, { bookId: '1' });
        await expect(getResponse).toHaveSuccessfulStatus(200, 'Permission to read book');
        expect(getResponse.status).toBe(200);
        expect(getResponse.data).toBeDefined();
        
        // Write operation should fail
        // method 1: without status code return
        /*
        await expect(bookAPI.createBook(bookPayload.fiction.bookInput))
            .rejects.toMatchObject({
                message: 'Insufficient permissions',
                code: 'FORBIDDEN'
            });
        */
       // method 2: with status code return
        const createResponse = await bookAPI.sendQuery(CREATE_BOOK, { 
            bookInput: bookPayload.fiction.bookInput 
        });
        await expect(createResponse).toHaveSuccessfulStatus(403, 'No permission to create book as expected');
        expect(createResponse.status).toBe(403);
        expect(createResponse.error).toMatchObject({
            message: expect.stringMatching(/insufficient permissions|forbidden/i),
            code: 'FORBIDDEN'
        });
    });
});