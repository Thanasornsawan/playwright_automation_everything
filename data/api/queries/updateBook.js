const UPDATE_BOOK = `
  mutation UpdateExistingBook(
    $bookId: ID!, 
    $updateData: BookUpdateInput!
  ) {
    updateBook(
      id: $bookId, 
      input: $updateData
    ) {
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

module.exports = { UPDATE_BOOK };