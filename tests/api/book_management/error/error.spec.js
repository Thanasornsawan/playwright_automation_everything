const { test, expect } = require('@playwright/test');
const { setupTestAPI, bookPayload } = require('../utils/test.setup');

test.describe('Error Handling', () => {
    let bookAPI;

    test.beforeEach(async ({ request }) => {
        bookAPI = await setupTestAPI(request);
    });

    test('not found error', { tag: ['@smoke', '@error' ] }, async () => {
        await (async () => {
            const { error } = await bookAPI.getBook({ bookId: 'non-existent' });
            expect(error).toEqual({
                code: 'NOT_FOUND',
                field: 'id',
                message: 'Book not found'
            });
        })();        
    });

    test('timeout error', { tag: ['@smoke', '@error' ] }, async () => {
        const originalTimeout = bookAPI.defaultTimeout;
        bookAPI.defaultTimeout = 1; // force set timeout to 1ms

        await expect(bookAPI.getBook({ bookId: '1' }))
            .rejects.toMatchObject({
                code: 'TIMEOUT_ERROR'
            });

        bookAPI.defaultTimeout = originalTimeout;
    });

    test('validation error handling', { tag: ['@smoke', '@error' ] }, async () => {
        await expect(bookAPI.createBook({
            bookInput: {} // empty object instead of missing fields
        })).rejects.toMatchObject({
            code: 'VALIDATION_ERROR',
            field: 'bookInput',
            message: expect.stringContaining('Book creation requires valid input data')
        });
    });
});