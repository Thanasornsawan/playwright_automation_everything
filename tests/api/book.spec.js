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

    // Create test books
    //console.log('Creating mystery book with payload:', JSON.stringify(bookPayload.mystery.bookInput, null, 2));
    const mysteryBook = await bookAPI.createBook({ bookInput: bookPayload.mystery.bookInput });
    //console.log('Created mystery book:', JSON.stringify(mysteryBook, null, 2));

    //console.log('Creating non-fiction book with payload:', JSON.stringify(bookPayload.nonFiction.bookInput, null, 2));
    const nonFictionBook = await bookAPI.createBook({ bookInput: bookPayload.nonFiction.bookInput });
    //console.log('Created non-fiction book:', JSON.stringify(nonFictionBook, null, 2));

    // Wait a moment to ensure books are created
    await new Promise(resolve => setTimeout(resolve, 1000));

    const filterCriteria = {
      filter: {
        genres: [mysteryBook.genre], // Use actual genre from created book
        minRating: 4.0,
        priceRange: {
          min: 10,
          max: 30
        },
        availability: true
      },
      pagination: {
        page: 1,
        pageSize: 10
      },
      sorting: {
        field: 'publishedYear',
        direction: 'DESC'
      },
      dateRange: {
        start: '2020-01-01',
        end: '2024-12-31'
      },
      searchQuery: {
        searchTerm: mysteryBook.title.toLowerCase(),
        fields: ['title', 'author', 'tags'],
        fuzzyMatch: true
      }
    };

    //console.log('Applying filter criteria:', JSON.stringify(filterCriteria, null, 2));
    const filterResponse = await bookAPI.filterBooks(filterCriteria);
    //console.log('Filter response:', JSON.stringify(filterResponse, null, 2));

    expect(filterResponse.items).toBeDefined();
    expect(filterResponse.items.length).toBeGreaterThan(0);
    
    // Verify filter results
    filterResponse.items.forEach(book => {
      expect(filterCriteria.filter.genres).toContain(book.genre);
      expect(book.averageRating).toBeGreaterThanOrEqual(filterCriteria.filter.minRating);
      expect(book.isAvailable).toBe(true);
    });

    expect(filterResponse.pageInfo.totalCount).toBeGreaterThan(0);
    expect(filterResponse.aggregations.genreCount).toBeDefined();
  });
});