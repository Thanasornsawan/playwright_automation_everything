const { test, expect } = require('@playwright/test');
const { setupTestAPI, bookPayload } = require('../utils/test.setup');

test.describe('CRUD Operations', () => {
    let bookAPI;
    let createdBookId;

    test.beforeEach(async ({ request }) => {
        bookAPI = await setupTestAPI(request);
    });

    test('create book', { tag: ['@smoke', '@crud' ] }, async () => {
        const startTime = Date.now();
        const response = await bookAPI.createBook(bookPayload.fiction);
    
        expect(response.data).toMatchObject({
            title: bookPayload.fiction.bookInput.title,
            author: bookPayload.fiction.bookInput.author
        });
        
        createdBookId = response.data.id;
        // Performance validation
        expect(Date.now() - startTime).toBeLessThan(5000);
    });

    test('get book', { tag: ['@smoke', '@crud' ] }, async () => {
        const response = await bookAPI.getBook({ 
            bookId: createdBookId ,
            ratingLimit: 5});

        // Data validation
        expect(response.data.id).toBe(createdBookId);
        expect(response.data.title).toBe(bookPayload.fiction.bookInput.title);
        
        // Type validation
        expect(typeof response.data.averageRating).toBe('number');
        expect(Array.isArray(response.data.ratings)).toBe(true);
    });

    test('update book', { tag: ['@smoke', '@crud' ] }, async () => {
        const updatedTitle = "Updated Book Title";
        const response = await bookAPI.updateBook({
            bookId: createdBookId,
            updateData: { title: updatedTitle }
        });
        
        // Verify update
        expect(response.data.title).toBe(updatedTitle);
        // Verify other fields remain unchanged
        expect(response.data.author).toBe(bookPayload.fiction.bookInput.author);
        expect(response.data.ratings).toEqual(expect.any(Array));
    });

    test('delete book', { tag: ['@smoke', '@crud' ] }, async () => {
        const response = await bookAPI.deleteBook({
            id: createdBookId,
            softDelete: true,
            reason: 'Testing deletion'
        });
        // Verify deletion
        expect(response.success).toBe(true);
        expect(response.deletedBookId).toBe(createdBookId);

        // Verify book no longer exists
        const getResponse = await bookAPI.getBook({ bookId: createdBookId });
        expect(getResponse.error).toMatchObject({
            code: 'NOT_FOUND',
            field: 'id',
            message: 'Book not found'
        });
        expect(getResponse.data).toBeNull();

    });
});