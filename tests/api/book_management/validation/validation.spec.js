const { test, expect } = require('@playwright/test');
const { setupTestAPI, bookPayload } = require('../utils/test.setup');

test.describe('Data Validation', () => {
    let bookAPI;

    test.beforeEach(async ({ request }) => {
        bookAPI = await setupTestAPI(request);
    });

    test('title validation', { tag: ['@smoke', '@validation' ] }, async () => {
        const invalidBook = {
            ...bookPayload.fiction.bookInput,
            title: 'a'.repeat(256) // Exceeds the 255-character limit
        };
    
        const response = await bookAPI.createBook({ bookInput: invalidBook });
    
        // Check that the response contains the expected error
        expect(response.error).toEqual({
            code: 'VALIDATION_ERROR',
            field: 'title',
            message: 'Title is required and must be less than 255 characters'
        });
        
    });    

    test('price validation', { tag: ['@smoke', '@validation' ] }, async () => {
        const invalidBook = {
            ...bookPayload.fiction.bookInput,
            pricing: { retailPrice: -10, currency: 'USD' }
        };

        const response = await bookAPI.createBook({ bookInput: invalidBook }); 
    
        // Check that the response contains the expected error
        expect(response.error).toEqual({
            code: 'VALIDATION_ERROR',
            field: 'pricing.retailPrice',
            message: 'Price cannot be negative'
        });

    });

    test('publication year validation', { tag: ['@smoke', '@validation' ] }, async () => {
        const invalidBook = {
            ...bookPayload.fiction.bookInput,
            publishedYear: new Date().getFullYear() + 1
        };

        const response = await bookAPI.createBook({ bookInput: invalidBook }); 
    
        // Check that the response contains the expected error
        expect(response.error).toEqual({
            code: 'VALIDATION_ERROR',
            field: 'publishedYear',
            message: 'Published year cannot be in the future'
        });
    });

    test('handle empty values', { tag: ['@smoke', '@validation' ] }, async () => {
        const invalidBook = {
            ...bookPayload.fiction.bookInput,
            ratings: []
        };
  
        const response = await bookAPI.createBook({ bookInput: invalidBook }); 
        expect(response.data.averageRating).toBe(0);
    });

});