const Book = require('../models/Book');
const { ErrorCodes, BookError } = require('../types/errors');

class BookService {
   constructor() {
       this.books = [];
       this.requestTimeout = 5000;
   }

   async create(bookData) {
    try {
        const newBook = new Book({
            id: String(this.books.length + 1),
            ...bookData,
            lastUpdated: new Date().toISOString(),
            modifiedBy: 'system'
        });

        // Additional validations
        newBook.validate();
        
        this.books.push(newBook);
        //console.log('New book created:', newBook);
        return { data: newBook, error: null };

    } catch (error) {
        throw error instanceof BookError ? error : 
            new BookError('Validation failed: ' + error.message, ErrorCodes.VALIDATION_ERROR);
    }
    }

    async findById(id) {
           try {
               const book = this.books.find(book => book.id === id);
               if (!book) {
                   throw new BookError(
                       'Book not found',
                       ErrorCodes.NOT_FOUND,
                       'id'
                   );
               }
               return { data: book, error: null };
           } catch (error) {
               throw error instanceof BookError ? error :
                   new BookError(error.message, ErrorCodes.INTERNAL_ERROR);
           }
    }

   async update(id, updateData) {
       try {
           const existingBook = await this.findById(id);
           if (!existingBook.data) {
               throw new BookError(
                   'Book not found',
                   ErrorCodes.NOT_FOUND,
                   'id'
               );
           }

           const mergedData = {
               ...existingBook.data,
               ...updateData,
               ratings: updateData.ratings || existingBook.data.ratings,
               id,
               lastUpdated: new Date().toISOString()
           };

           const updatedBook = new Book(mergedData);
           updatedBook.validate();
           
           const index = this.books.findIndex(b => b.id === id);
           this.books[index] = updatedBook;
           
           return { data: updatedBook, error: null };

       } catch (error) {
           throw error instanceof BookError ? error :
               new BookError(error.message, ErrorCodes.INTERNAL_ERROR);
       }
   }

   async delete(id) {
       try {
           const index = this.books.findIndex(book => book.id === id);
           if (index === -1) {
               throw new BookError(
                   'Book not found',
                   ErrorCodes.NOT_FOUND,
                   'id'
               );
           }
           
           this.books.splice(index, 1);
           return { data: { success: true }, error: null };

       } catch (error) {
           throw error instanceof BookError ? error :
               new BookError(error.message, ErrorCodes.INTERNAL_ERROR);
       }
   }

   async filterBooks(filter = {}, pagination = { page: 1, pageSize: 10 }, sorting, ratingThreshold, dateRange, searchQuery) {
       try {
           let filteredBooks = [...this.books];
           if (filter) {
               if (filter.genres?.length) {
                   filteredBooks = filteredBooks.filter(book => 
                       filter.genres.includes(book.genre)
                   );
                   //console.log('Filtered books by genre:', filteredBooks);
               }

               if (filter.minRating) {
                   filteredBooks = filteredBooks.filter(book => {
                       const avgRating = book.getAverageRating();
                       return avgRating >= filter.minRating;
                   });
               }

               if (filter.tags?.length) {
                   filteredBooks = filteredBooks.filter(book =>
                       filter.tags.every(tag => book.tags.includes(tag))
                   );
               }

               if (filter.availability !== undefined) {
                   filteredBooks = filteredBooks.filter(book => 
                       book.isAvailable === filter.availability
                   );
               }
           }

           if (ratingThreshold) {
               filteredBooks = filteredBooks.filter(book => {
                   const avgRating = book.getAverageRating();
                   return avgRating >= ratingThreshold;
               });
           }

           if (dateRange) {
               const { start, end } = dateRange;
               filteredBooks = filteredBooks.filter(book => {
                   const bookDate = new Date(book.lastUpdated);
                   return bookDate >= new Date(start) && bookDate <= new Date(end);
               });
           }

           if (searchQuery) {
               const { searchTerm, fields, fuzzyMatch } = searchQuery;
               filteredBooks = filteredBooks.filter(book => {
                   return fields.some(field => {
                       const fieldValue = String(book[field] || '');
                       if (fuzzyMatch) {
                           return fieldValue.toLowerCase().includes(searchTerm.toLowerCase());
                       }
                       return fieldValue === searchTerm;
                   });
               });
           }

           if (sorting) {
               const { field, direction } = sorting;
               filteredBooks.sort((a, b) => {
                   let aValue = a[field];
                   let bValue = b[field];

                   if (field === 'averageRating') {
                       aValue = a.getAverageRating();
                       bValue = b.getAverageRating();
                   }

                   const multiplier = direction === 'DESC' ? -1 : 1;
                   if (aValue < bValue) return -1 * multiplier;
                   if (aValue > bValue) return 1 * multiplier;
                   return 0;
               });
           }

           const totalCount = filteredBooks.length;
           const { page, pageSize } = pagination;
           const startIndex = (page - 1) * pageSize;
           const endIndex = startIndex + pageSize;
           const items = filteredBooks.slice(startIndex, endIndex);

           const pageInfo = {
               totalCount,
               hasNextPage: endIndex < totalCount,
               hasPreviousPage: page > 1,
               currentPage: page,
               totalPages: Math.ceil(totalCount / pageSize)
           };

           const result = {
               data: {
                   items,
                   pageInfo,
                   aggregations: this.calculateAggregations(filteredBooks)
               },
               error: null
           };

           return result;

       } catch (error) {
           throw error instanceof BookError ? error :
               new BookError(error.message, ErrorCodes.INTERNAL_ERROR);
       }
   }

   calculateAggregations(books) {
       try {
           const genreCount = books.reduce((acc, book) => {
               acc[book.genre] = (acc[book.genre] || 0) + 1;
               return acc;
           }, {});

           const prices = books
               .map(book => book.pricing?.retailPrice)
               .filter(price => price !== undefined && !isNaN(price));

           const priceRange = prices.length > 0 ? {
               min: Math.min(...prices),
               max: Math.max(...prices),
               average: prices.reduce((sum, price) => sum + price, 0) / prices.length
           } : {
               min: 0,
               max: 0,
               average: 0
           };

           return {
               genreCount: Object.entries(genreCount).map(([genre, count]) => ({ 
                   genre, 
                   count 
               })),
               priceRange,
               ratingDistribution: this.calculateRatingDistribution(books),
               publisherStats: this.calculatePublisherStats(books)
           };

       } catch (error) {
           throw error instanceof BookError ? error :
               new BookError(error.message, ErrorCodes.INTERNAL_ERROR);
       }
   }

   calculateRatingDistribution(books) {
       try {
           const distribution = new Map();
           books.forEach(book => {
               if (book.ratings) {
                   book.ratings.forEach(rating => {
                       const roundedRating = Math.round(rating.score * 2) / 2;
                       distribution.set(roundedRating, 
                           (distribution.get(roundedRating) || 0) + 1);
                   });
               }
           });

           return Array.from(distribution.entries())
               .map(([rating, count]) => ({ rating, count }))
               .sort((a, b) => b.rating - a.rating);

       } catch (error) {
           throw error instanceof BookError ? error :
               new BookError(error.message, ErrorCodes.INTERNAL_ERROR);
       }
   }

   calculatePublisherStats(books) {
    try {
        // Create a map to count books for each publisher
        const publisherMap = new Map();

        books.forEach(book => {
            if (book.publisher) {
                if (!publisherMap.has(book.publisher)) {
                    publisherMap.set(book.publisher, { publisher: book.publisher, bookCount: 0 });
                }
                publisherMap.get(book.publisher).bookCount += 1;
            }
        });

        // Convert the map to an array of `PublisherWithCount`
        const topPublishers = Array.from(publisherMap.values());

        // Total unique publishers
        const totalPublishers = publisherMap.size;

        return {
            totalPublishers,
            topPublishers
        };
    } catch (error) {
        throw error instanceof BookError ? error :
            new BookError(error.message, ErrorCodes.INTERNAL_ERROR);
    }
    }
}

module.exports = BookService;