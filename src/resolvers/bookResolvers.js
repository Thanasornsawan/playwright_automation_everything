const { ErrorCodes, BookError } = require('../types/errors');

function createBookResolvers(bookService) {
   return {
       Book: {
           averageRating: (book) => {
               try {
                   return book.ratings?.length ? book.getAverageRating() : 0;
               } catch (error) {
                   throw new BookError(
                       'Error calculating average rating',
                       ErrorCodes.INTERNAL_ERROR,
                       'ratings'
                   );
               }
           },
           totalRatings: (book) => {
               try {
                   return book.getTotalRatings();
               } catch (error) {
                   throw new BookError(
                       'Error calculating total ratings',
                       ErrorCodes.INTERNAL_ERROR,
                       'ratings'
                   );
               }
           },
           pricing: (book) => {
               try {
                   return {
                       ...book.pricing,
                       finalPrice: book.getFinalPrice()
                   };
               } catch (error) {
                   throw new BookError(
                       'Error calculating final price',
                       ErrorCodes.INTERNAL_ERROR,
                       'pricing'
                   );
               }
           }
       },
       Query: {
           books: async (_, args, { res }) => {
               try {
                   const result = await bookService.filterBooks(
                       args.filter,
                       args.pagination || { page: 1, pageSize: 10 }, // Add default pagination
                       args.sort,
                       args.ratingThreshold,
                       args.dateRange,
                       args.searchQuery
                   );
                   //console.log('books resolver result:', result);
                   return {
                    data: {
                        items: result.data.items,
                        pageInfo: result.data.pageInfo,
                        aggregations: result.data.aggregations
                    },
                    error: null
                };
               } catch (error) {
                   console.log('Error in books resolver:', error);
                   if (error instanceof BookError) {
                       const statusCode = BookError.mapErrorToStatus(error.code);
                       res?.status(statusCode);
                       return {
                           data: null, 
                           error: {
                               message: error.message,
                               code: error.code,
                               field: error.field
                           }
                       };
                   }
                   throw error;
               }
           },
           book: async (_, { id }, { res }) => {
               try {
                   const book = await bookService.findById(id);
                   return {
                       data: book.data,
                       error: null
                   };
               } catch (error) {
                   if (error instanceof BookError) {
                       const statusCode = BookError.mapErrorToStatus(error.code);
                       res?.status(statusCode);
                       return {
                           data: null,
                           error: {
                               message: error.message,
                               code: error.code,
                               field: error.field
                           }
                       };
                   }
                   throw error;
               }
           }
       },
       Mutation: {
           createBook: async (_, { input }, { res }) => {
               try {
                const book = await bookService.create(input);
                res?.status(201);
                return {
                    data: book.data,
                    error: null
                };
            } catch (error) {
                if (error instanceof BookError) {
                    const statusCode = BookError.mapErrorToStatus(error.code);
                    res?.status(statusCode);
                    return {
                        data: null,
                        error: {
                            message: error.message,
                            code: error.code,
                            field: error.field
                        }
                    };
                }
                throw error;
            }
           },
           updateBook: async (_, { id, input }, { res }) => {
               try {
                   const book = await bookService.update(id, input);
                   return {
                       data: book.data,
                       error: null
                   };
               } catch (error) {
                   if (error instanceof BookError) {
                       const statusCode = BookError.mapErrorToStatus(error.code);
                       res?.status(statusCode);
                       return {
                           data: null,
                           error: {
                               message: error.message,
                               code: error.code,
                               field: error.field
                           }
                       };
                   }
                   throw error;
               }
           },
           deleteBook: async (_, { id, softDelete, reason }, { res }) => {

            //console.log('deleteBook called with:', { id, softDelete, reason });

            try {
                const result = await bookService.delete(id);
                //console.log('deleteBook result:', result);
                if (!result.data.success) {
                    throw new BookError('Book not found', ErrorCodes.NOT_FOUND, 'id');
                }
                return {
                    success: true,
                    message: 'Book deleted successfully',
                    deletedBookId: id,
                    timestamp: new Date().toISOString(),
                    deletionDetails: {
                        deletedBy: 'system',  
                        deletionType: softDelete ? 'soft' : 'hard',
                        reason: reason || 'Not specified',
                        canBeRestored: softDelete || false
                    },
                    error: null
                };
            } catch (error) {
                //console.error('Error in deleteBook resolver:', error);
                return {
                    success: false,
                    message: error.message,
                    deletedBookId: id,
                    timestamp: new Date().toISOString(),
                    deletionDetails: null,
                    error: {
                        message: error.message,
                        code: error.code || 'INTERNAL_ERROR',
                        field: error.field || null
                    }
                };
            }
         }
       }
   };
}

module.exports = { createBookResolvers };