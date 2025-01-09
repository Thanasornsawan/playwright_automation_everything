const Book = require('../models/Book');

class BookService {
  constructor() {
    this.books = [];
  }

  create(bookData) {
    const newBook = new Book({
      id: String(this.books.length + 1),
      ...bookData,
      lastUpdated: new Date().toISOString(),
      modifiedBy: 'system'
    });
    this.books.push(newBook);
    return newBook;
  }

  findById(id) {
    return this.books.find(book => book.id === id);
  }

  update(id, updateData) {
    const index = this.books.findIndex(book => book.id === id);
    if (index === -1) throw new Error('Book not found');

    this.books[index] = new Book({
      ...this.books[index],
      ...updateData,
      id,
      lastUpdated: new Date().toISOString()
    });

    return this.books[index];
  }

  delete(id) {
    const index = this.books.findIndex(book => book.id === id);
    if (index === -1) return false;
    
    this.books.splice(index, 1);
    return true;
  }

  filterBooks(filter = {}, pagination = { page: 1, pageSize: 10 }, sorting, ratingThreshold, dateRange, searchQuery) {
    let filteredBooks = [...this.books];

    // Apply filters
    if (filter) {
      if (filter.genres?.length) {
        filteredBooks = filteredBooks.filter(book => filter.genres.includes(book.genre));
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
        filteredBooks = filteredBooks.filter(book => book.isAvailable === filter.availability);
      }
    }

    // Apply date range
    if (dateRange) {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      filteredBooks = filteredBooks.filter(book => {
        const publishDate = new Date(book.publishedYear, 0);
        return publishDate >= start && publishDate <= end;
      });
    }

    // Apply search query
    if (searchQuery) {
      const { searchTerm, fields, fuzzyMatch } = searchQuery;
      const searchLower = searchTerm.toLowerCase();
      filteredBooks = filteredBooks.filter(book =>
        fields.some(field => {
          const value = book[field]?.toString().toLowerCase();
          if (!value) return false;
          return fuzzyMatch ? 
            value.includes(searchLower) : 
            value === searchLower;
        })
      );
    }

    // Apply sorting
    if (sorting) {
      const { field, direction } = sorting;
      filteredBooks.sort((a, b) => {
        const aValue = a[field];
        const bValue = b[field];
        const multiplier = direction === 'DESC' ? -1 : 1;
        
        if (aValue < bValue) return -1 * multiplier;
        if (aValue > bValue) return 1 * multiplier;
        return 0;
      });
    }

    // Calculate total count before pagination
    const totalCount = filteredBooks.length;

    // Apply pagination
    const { page, pageSize } = pagination;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const items = filteredBooks.slice(startIndex, endIndex);

    // Calculate aggregations
    const aggregations = this.calculateAggregations(filteredBooks);

    // Prepare page info
    const pageInfo = {
      totalCount,
      hasNextPage: endIndex < totalCount,
      hasPreviousPage: page > 1,
      currentPage: page,
      totalPages: Math.ceil(totalCount / pageSize)
    };

    return {
      items,
      pageInfo,
      aggregations
    };
  }

  calculateAggregations(books) {
    // Genre count
    const genreCount = books.reduce((acc, book) => {
      acc[book.genre] = (acc[book.genre] || 0) + 1;
      return acc;
    }, {});

    // Price range
    const prices = books
      .map(book => {
        if (!book.pricing) return null;
        const discount = book.pricing.discount || 0;
        return book.pricing.retailPrice * (1 - discount);
      })
      .filter(price => price !== null && !isNaN(price) && isFinite(price));

    let priceRange;
    if (prices.length > 0) {
      priceRange = {
        min: Math.min(...prices),
        max: Math.max(...prices),
        average: prices.reduce((sum, price) => sum + price, 0) / prices.length
      };
    } else {
      priceRange = {
        min: 0,
        max: 0,
        average: 0
      };
    }

    // Rating distribution
    const ratingDistribution = new Map();
    books.forEach(book => {
      if (book.ratings) {
        book.ratings.forEach(rating => {
          const roundedRating = Math.round(rating.score * 2) / 2;
          ratingDistribution.set(roundedRating, 
            (ratingDistribution.get(roundedRating) || 0) + 1);
        });
      }
    });

    // Publisher stats
    const publishers = new Map();
    books.forEach(book => {
      if (!book.publisher) return;
      
      const publisherId = book.publisher.id;
      if (!publishers.has(publisherId)) {
        publishers.set(publisherId, {
          publisher: book.publisher,
          count: 0
        });
      }
      publishers.get(publisherId).count++;
    });

    return {
      genreCount: Object.entries(genreCount).map(([genre, count]) => ({ genre, count })),
      priceRange,
      ratingDistribution: Array.from(ratingDistribution.entries())
        .map(([rating, count]) => ({ rating, count }))
        .sort((a, b) => b.rating - a.rating),
      publisherStats: {
        totalPublishers: publishers.size,
        topPublishers: Array.from(publishers.values())
          .sort((a, b) => b.count - a.count)
          .map(({ publisher, count }) => ({
            publisher,
            bookCount: count
          }))
      }
    };
  }
}

module.exports = BookService;