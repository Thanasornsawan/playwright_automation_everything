const CREATE_BOOK = `
  mutation CreateNewBook($bookInput: BookInput!) {
    createBook(input: $bookInput) {
      id
      title
      author
      genre
      publishedYear
      tags
      ratings {
        userId
        score
        review
        dateRated
      }
      averageRating
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
  }
`;

module.exports = { CREATE_BOOK };