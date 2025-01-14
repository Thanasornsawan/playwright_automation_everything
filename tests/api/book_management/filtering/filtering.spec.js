const { test, expect } = require('@playwright/test');
const { setupTestAPI, bookPayload } = require('../utils/test.setup');

test.describe('Filtering and Search', () => {
    let bookAPI;
    let createdBookIds = [];  // Keep track of created books

    test.beforeEach(async ({ request }) => {
        bookAPI = await setupTestAPI(request);
        
        // Create test books and store their IDs
        const books = await Promise.all([
            bookAPI.createBook({ bookInput: bookPayload.fiction.bookInput }),
            bookAPI.createBook({ bookInput: bookPayload.mystery.bookInput })
        ]);
        
        // Store the IDs for cleanup
        createdBookIds = books.map(book => book.data.id);

        // Attach createdBookIds to the test report
        test.info().attach('Created Book', {
            body: JSON.stringify(books, null, 2), // Format as JSON for readability
            contentType: 'application/json'
        });
    });
    
    test('filter by genre', { tag: ['@smoke', '@filter' ] }, async () => {
        const response = await bookAPI.filterBooks({
            filter: { genres: ['MYSTERY'] }
        });

        expect(response.data.items[0].genre).toBe('MYSTERY');
    });

    test('search with fuzzy match', { tag: ['@smoke', '@filter' ] }, async () => {
        const response = await bookAPI.filterBooks({
            filter: {},
            searchQuery: {
                searchTerm: 'mystery',
                fields: ['title', 'genre'],
                fuzzyMatch: true
            }
        });

        expect(response.data.items.length).toBeGreaterThan(0);
        response.data.items.forEach(book => {
            expect(
                book.title.toLowerCase().includes('mystery') ||
                book.genre.toLowerCase().includes('mystery')
            ).toBeTruthy();
        });
    });

    test('date range filter', { tag: ['@smoke', '@filter' ] }, async () => {
        const response = await bookAPI.filterBooks({
            filter: {},
            dateRange: {
                start: '2024-01-01',
                end: '2024-12-31'
            }
        });
    
        response.data.items.forEach(book => {
            const bookDate = new Date(book.lastUpdated);
            expect(bookDate).toBeGreaterThanOrEqual(new Date('2024-01-01'));
            expect(bookDate).toBeLessThanOrEqual(new Date('2024-12-31'));
        });
    });

    test('filter by rating threshold', { tag: ['@smoke', '@filter' ] }, async () => {
        const response = await bookAPI.filterBooks({
            filter: {},
            pagination: { page: 1, pageSize: 10 },
            ratingThreshold: 4.5
        });
        
        response.data.items.forEach(book => {
            expect(book.averageRating).toBeGreaterThanOrEqual(4.5);
        });
    });

    test('test sorting', { tag: ['@smoke', '@filter' ] }, async () => {
        await test.step('sort by desc', async () => {
            const response = await bookAPI.filterBooks({
                filter: {},
                pagination: { page: 1, pageSize: 10 },
                sorting: {
                    field: 'publishedYear',
                    direction: 'DESC'
                }
            });

            // Verify sort order
            const years = response.data.items.map(book => book.publishedYear);
            expect(years).toEqual([...years].sort((a, b) => b - a));
        });
        await test.step('sort by asc', async () => {
            const response = await bookAPI.filterBooks({
                filter: {},
                pagination: { page: 1, pageSize: 10 },
                sorting: {
                    field: 'publishedYear',
                    direction: 'ASC'
                }
            });

            // Verify sort order
            const years = response.data.items.map(book => book.publishedYear);
            expect(years).toEqual([...years].sort((a, b) => a - b));
        });
    });

    test('test aggregations', { tag: ['@smoke', '@filter' ] }, async () => {
        const response = await bookAPI.filterBooks({
            filter: {},
            pagination: { page: 1, pageSize: 10 }
        });
        
        expect(response.data.aggregations).toEqual(expect.objectContaining({
            genreCount: expect.arrayContaining([
                expect.objectContaining({
                    genre: expect.any(String),
                    count: expect.any(Number)
                })
            ]),
            priceRange: expect.objectContaining({
                min: expect.any(Number),
                max: expect.any(Number),
                average: expect.any(Number)
            }),
            ratingDistribution: expect.arrayContaining([
                expect.objectContaining({
                    rating: expect.any(Number),
                    count: expect.any(Number)
                })
            ]),
        }));

        expect(response.data.aggregations).toHaveProperty('publisherStats');
    });


    /*
    ensure cleanup always completes, but also know at the end whether any deletions failed,
    you can collect failed deletions and throw an error after the loop 
    */
    test.afterEach(async () => {
        const failedDeletions = [];
    
        for (const bookId of createdBookIds) {
            try {
                await bookAPI.deleteBook({
                    id: bookId,
                    softDelete: false,
                    reason: 'Test cleanup'
                });
            } catch (error) {
                console.log(`Failed to delete book ${bookId}:`, error);
                failedDeletions.push(bookId);
            }
        }
    
        createdBookIds = [];
    
        if (failedDeletions.length > 0) {
            throw new Error(`Failed to delete books: ${failedDeletions.join(', ')}`);
        }
    });
    
});