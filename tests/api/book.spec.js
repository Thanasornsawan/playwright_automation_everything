const { test, expect } = require('@playwright/test');
const BookPage = require('../../api/bookPage');
const bookPayload = require('../../data/api/book_payload.json');

test.describe('Book API Tests with Authentication', () => {
  let bookAPI;

  test.beforeEach(({ request }) => {
    bookAPI = new BookPage(request);
  });

  test('should handle unauthorized access with invalid API key', async () => {
    bookAPI.setApiKey('invalid-api-key');
    
    try {
      await bookAPI.getBook({ 
        bookId: '1',
        includeRatings: true
      });
      throw new Error('Should have failed with invalid API key');
    } catch (error) {
      expect(error.message).toBe('Invalid API key');
    }
  });

  test('should handle read-only API key permissions', async () => {
    bookAPI.setApiKey('test-api-key-readonly');
    
    // Should succeed for read operation
    const book = await bookAPI.getBook({ 
      bookId: '1',
      includeRatings: true
    });
    expect(book).toBeDefined();

    // Should fail for write operation
    try {
      await bookAPI.createBook({
        bookInput: bookPayload.fiction.bookInput
      });
      throw new Error('Should have failed with read-only API key');
    } catch (error) {
      expect(error.message).toBe('Insufficient permissions');
    }
  });

  test('complete CRUD cycle with valid admin API key', async () => {
    test.setTimeout(30000);
    bookAPI.setApiKey('test-api-key-123');

    // Create book
    //console.log('Creating book...');
    const createPayload = {
      bookInput: {
        title: "Test Book",
        author: "Test Author",
        genre: "FICTION",
        publishedYear: 2023,
        tags: ["test"],
        isAvailable: true,
        publisher: {
          id: "pub123",
          name: "Test Publisher",
          country: "USA"
        },
        metadata: {
          isbn: "123-456",
          edition: "First",
          language: "English",
          format: "Hardcover",
          pageCount: 200
        },
        pricing: {
          retailPrice: 29.99,
          discount: 0.1,
          currency: "USD"
        },
        ratings: [{
          userId: "user1",
          score: 4.5,
          review: "Good",
          dateRated: "2024-01-01"
        }]
      }
    };

    const createResponse = await bookAPI.createBook(createPayload);
    //console.log('Book created:', createResponse.id);
    expect(createResponse.title).toBe(createPayload.bookInput.title);
    
    const bookId = createResponse.id;

    // Get book
    //console.log('Getting book...');
    const getResponse = await bookAPI.getBook({
      bookId,
      includeRatings: true,
      includePublisher: true,
      ratingLimit: 5,
      includePricing: true
    });
    expect(getResponse.title).toBe(createPayload.bookInput.title);

    // Update book
    //console.log('Updating book...');
    const updateResponse = await bookAPI.updateBook({
      bookId,
      updateData: {
        title: "Updated Test Book"
      }
    });
    expect(updateResponse.title).toBe("Updated Test Book");

    // Delete book
    //console.log('Deleting book...');
    const deleteResponse = await bookAPI.deleteBook({
      id: bookId,
      softDelete: true,
      reason: "Test cleanup"
    });
    expect(deleteResponse.success).toBe(true);

    // Verify deletion
    //console.log('Verifying deletion...');
    const verifyResponse = await bookAPI.getBook({
      bookId,
      includeRatings: false,
      includePublisher: false
    });
    expect(verifyResponse).toBeNull();
    //console.log('Test completed successfully');
  });

  test('complex filtering with authentication', async () => {
    bookAPI.setApiKey('test-api-key-123');

    // Create both mystery and non-fiction books
    console.log('Creating test books...');
    await Promise.all([
      bookAPI.createBook({ bookInput: bookPayload.mystery.bookInput }),
      bookAPI.createBook({ bookInput: bookPayload.nonFiction.bookInput })
    ]);

    // Use the filterOptions directly from our payload
    const filterResponse = await bookAPI.filterBooks(bookPayload.filterOptions);
    
    // Verify the response
    expect(filterResponse.items).toBeDefined();
    expect(filterResponse.items.length).toBeGreaterThan(0);
    
    // Verify each book matches our filter criteria
    filterResponse.items.forEach(book => {
      // Check genre is either MYSTERY or FICTION
      expect(bookPayload.filterOptions.filter.genres).toContain(book.genre);
      
      // Check rating is at least 4.0
      expect(book.averageRating).toBeGreaterThanOrEqual(
        bookPayload.filterOptions.filter.minRating
      );
      
      // Check availability
      expect(book.isAvailable).toBe(true);
      
      // Check publish year is within date range
      const publishYear = new Date(book.publishedYear, 0);
      const startDate = new Date(bookPayload.filterOptions.dateRange.start);
      const endDate = new Date(bookPayload.filterOptions.dateRange.end);
      expect(publishYear >= startDate && publishYear <= endDate).toBeTruthy();
    });

    expect(filterResponse.pageInfo.totalCount).toBeGreaterThan(0);
    expect(filterResponse.aggregations.genreCount).toBeDefined();
  });
});