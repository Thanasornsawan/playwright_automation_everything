function calculateAverageRating(ratings) {
    if (!ratings || ratings.length === 0) return null;
    return ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length;
  }
  
  function calculateFinalPrice(pricing) {
    if (!pricing || !pricing.retailPrice) return 0;
    const discount = pricing.discount || 0;
    return pricing.retailPrice * (1 - discount);
  }
  
  function createBookResolvers(bookService) {
    return {
      Book: {
        averageRating: (book) => calculateAverageRating(book.ratings),
        totalRatings: (book) => book.ratings?.length || 0,
        ratings: (book, { limit }) => {
          if (limit && book.ratings) {
            return book.ratings.slice(0, limit);
          }
          return book.ratings || [];
        }
      },
      Pricing: {
        finalPrice: (pricing) => calculateFinalPrice(pricing)
      },
      Query: {
        books: (_, { filter, pagination, sort, ratingThreshold, dateRange, searchQuery }) => {
          return bookService.filterBooks(
            filter,
            pagination,
            sort,
            ratingThreshold,
            dateRange,
            searchQuery
          );
        },
        book: (_, { id }) => bookService.findById(id)
      },
      Mutation: {
        createBook: (_, { input }) => {
          return bookService.create(input);
        },
        updateBook: (_, { id, input }) => {
          return bookService.update(id, input);
        },
        deleteBook: (_, { id, softDelete, reason }) => {
          const success = bookService.delete(id);
          if (!success) {
            throw new Error('Book not found');
          }
          return {
            success: true,
            message: 'Book successfully deleted',
            deletedBookId: id,
            timestamp: new Date().toISOString(),
            deletionDetails: {
              deletedBy: 'system',
              deletionType: softDelete ? 'soft' : 'hard',
              reason: reason || 'Not specified',
              canBeRestored: softDelete || false
            }
          };
        }
      }
    };
  }
  
  module.exports = { createBookResolvers };