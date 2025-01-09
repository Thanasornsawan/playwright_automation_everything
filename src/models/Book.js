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
      if (!this.ratings || this.ratings.length === 0) return null;
      return this.ratings.reduce((sum, rating) => sum + rating.score, 0) / this.ratings.length;
    }
  
    getTotalRatings() {
      return this.ratings.length;
    }
  
    getFinalPrice() {
      if (!this.pricing) return null;
      const { retailPrice, discount = 0 } = this.pricing;
      return retailPrice * (1 - discount);
    }
  }
  
  module.exports = Book;