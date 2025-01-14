const { ErrorCodes, BookError } = require('../types/errors');

class Book {
    constructor(data) {
      this.id = data.id;
      this.title = data.title;
      this.author = data.author;
      this.genre = data.genre;
      this.publishedYear = data.publishedYear;
      this.tags = data.tags || [];
      this.ratings = data.ratings || [];
      this.isAvailable = data.isAvailable;
      this.publisher = data.publisher;
      this.metadata = data.metadata;
      this.pricing = data.pricing;
      this.lastUpdated = data.lastUpdated || new Date().toISOString();
      this.modifiedBy = data.modifiedBy || 'system';
      this.totalRatings = this.ratings.length; 
    }
  
    getAverageRating() {
        // Only calculate if ratings exist and are not empty
        if (!this.ratings || this.ratings.length === 0) {
            return 0;
        }
        return this.ratings.reduce((sum, rating) => sum + rating.score, 0) / this.ratings.length;
    }
  
    getTotalRatings() {
        return this.ratings?.length || 0;
    }
  
    getFinalPrice() {
      if (!this.pricing) return null;
      const { retailPrice, discount = 0 } = this.pricing;
      return retailPrice * (1 - discount);
    }

    validate() {
        // Business rules validation
        if (!this.title || this.title.length > 255) {
            //throw new Error('Title is required and must be less than 255 characters');
            throw new BookError(
                'Title is required and must be less than 255 characters',
                ErrorCodes.VALIDATION_ERROR,
                'title'
            );
        }
        if (!this.author) {
            //throw new Error('Author is required');
            throw new BookError(
                'Author is required',
                ErrorCodes.VALIDATION_ERROR,
                'author'
            );
        }
        if (this.pricing && this.pricing.retailPrice < 0) {
            //throw new Error('Price cannot be negative');
            throw new BookError(
                'Price cannot be negative',
                ErrorCodes.VALIDATION_ERROR,
                'pricing.retailPrice'
            );
        }
        if (this.publishedYear > new Date().getFullYear()) {
            //throw new Error('Published year cannot be in the future');
            throw new BookError(
                'Published year cannot be in the future',
                ErrorCodes.VALIDATION_ERROR,
                'publishedYear'
            );
        }

        if (this.pricing?.currency && !['USD', 'EUR', 'GBP'].includes(this.pricing.currency)) {
            throw new BookError(
                'Invalid currency code',
                ErrorCodes.VALIDATION_ERROR,
                'pricing.currency'
            );
        }

        if (this.pricing?.discount && (this.pricing.discount < 0 || this.pricing.discount > 1)) {
            throw new BookError(
                'Discount must be between 0 and 1',
                ErrorCodes.VALIDATION_ERROR,
                'pricing.discount'
            );
        }

        if (this.ratings?.some(rating => rating.score < 0 || rating.score > 5)) {
            throw new BookError(
                'Rating scores must be between 0 and 5',
                ErrorCodes.VALIDATION_ERROR,
                'ratings.score'
            );
        }

    }

  }
  
  module.exports = Book;