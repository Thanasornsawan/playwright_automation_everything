const FILTER_BOOKS = `
  query FilterBooksWithCriteria(
    $filter: BookFilterInput!,
    $pagination: PaginationInput,
    $sorting: BookSortingInput,
    $includePricing: Boolean = false,
    $includePublisher: Boolean = false,
    $includeMetadata: Boolean = false,
    $ratingThreshold: Float,
    $dateRange: DateRangeInput,
    $searchQuery: SearchQueryInput
  ) {
    books(
      filter: $filter,
      pagination: $pagination,
      sort: $sorting,
      ratingThreshold: $ratingThreshold,
      dateRange: $dateRange,
      searchQuery: $searchQuery
    ) {
      data {
        items {
          id
          title
          author
          genre
          publishedYear
          tags
          averageRating
          isAvailable
          ... @include(if: $includePublisher) {
            publisher {
              id
              name
              country
            }
          }
          ... @include(if: $includeMetadata) {
            metadata {
              isbn
              edition
              language
              format
              pageCount
            }
          }
          ... @include(if: $includePricing) {
            pricing {
              retailPrice
              discount
              finalPrice
              currency
            }
          }
        }
        pageInfo {
          totalCount
          hasNextPage
          hasPreviousPage
          currentPage
          totalPages
        }
        aggregations {
          genreCount {
            genre
            count
          }
          priceRange {
            min
            max
            average
          }
          ratingDistribution {
            rating
            count
          }
          publisherStats {
            totalPublishers
            topPublishers {
              publisher {
                id
                name
              }
              bookCount
            }
          }
        }
      }
      error {
        message
        code
        field
      }
    }
  }
`;

module.exports = { FILTER_BOOKS };