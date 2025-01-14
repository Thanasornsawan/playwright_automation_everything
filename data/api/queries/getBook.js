const GET_BOOK = `
  query GetBookDetails($bookId: ID!, $ratingLimit: Int = 5) {
    book(id: $bookId) {
      data {
        id
        title
        author
        genre
        publishedYear
        tags
        ratings(limit: $ratingLimit) {
          userId
          score
          review
          dateRated
        }
        averageRating
        totalRatings
        isAvailable
        publisher {
          id
          name
          country
        }
        metadata {
          isbn
          edition
          language
          format
          pageCount
        }
        pricing {
          retailPrice
          discount
          finalPrice
          currency
        }
        lastUpdated
        modifiedBy
      }
      error {
        message
        code
        field
      }
    }
  }
`;

module.exports = { GET_BOOK };