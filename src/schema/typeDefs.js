const typeDefs = `#graphql
  enum ErrorCode {
    VALIDATION_ERROR
    NOT_FOUND
    PERMISSION_DENIED
    INTERNAL_ERROR
    TIMEOUT_ERROR
  }

  # Single error type for all error cases
  type GraphQLError {
    message: String!
    code: ErrorCode!
    field: String
  }

  # Response types with error field
  type BookResponse {
    data: Book
    error: GraphQLError
  }

  type BooksResponse {
    data: BookConnection
    error: GraphQLError
  }

  type DeletionResponse {
    success: Boolean
    message: String
    deletedBookId: ID
    timestamp: String
    deletionDetails: DeletionDetails
    error: GraphQLError
  }

  enum Genre {
    FICTION
    NON_FICTION
    SCIENCE_FICTION
    CLASSIC
    MYSTERY
  }

  type Rating {
    userId: String!
    score: Float!
    review: String
    dateRated: String!
  }

  type Publisher {
    id: ID!
    name: String!
    country: String!
    otherBooks: [Book]
  }

  type Metadata {
    isbn: String!
    edition: String!
    language: String!
    format: String!
    pageCount: Int!
  }

  type Pricing {
    retailPrice: Float!
    discount: Float
    finalPrice: Float!
    currency: String!
  }

  type Book {
    id: ID!
    title: String!
    author: String!
    genre: Genre!
    publishedYear: Int!
    tags: [String!]!
    ratings(limit: Int): [Rating!]!
    averageRating: Float
    totalRatings: Int!
    isAvailable: Boolean!
    publisher: Publisher!
    metadata: Metadata!
    pricing: Pricing!
    lastUpdated: String!
    modifiedBy: String!
  }

  input RatingInput {
    userId: String!
    score: Float!
    review: String
    dateRated: String!
  }

  input PublisherInput {
    id: ID!
    name: String!
    country: String!
  }

  input MetadataInput {
    isbn: String!
    edition: String!
    language: String!
    format: String!
    pageCount: Int!
  }

  input PricingInput {
    retailPrice: Float!
    discount: Float
    currency: String!
  }

  input BookInput {
    title: String!
    author: String!
    genre: Genre!
    publishedYear: Int!
    tags: [String!]!
    ratings: [RatingInput!]
    isAvailable: Boolean!
    publisher: PublisherInput!
    metadata: MetadataInput!
    pricing: PricingInput!
  }

  input BookUpdateInput {
    title: String
    author: String
    genre: Genre
    publishedYear: Int
    tags: [String!]
    isAvailable: Boolean
    pricing: PricingUpdateInput
  }

  input MetadataUpdateInput {
    edition: String
    language: String
    format: String
    pageCount: Int
  }

  input PricingUpdateInput {
    retailPrice: Float
    discount: Float
    currency: String
  }

  input BookSortingInput {
    field: String!
    direction: String!
  }

  input SearchQueryInput {
    searchTerm: String!
    fields: [String!]!
    fuzzyMatch: Boolean
  }

  input BookFilterInput {
    genres: [Genre!]
    minRating: Float
    tags: [String!]
    priceRange: PriceRangeInput
    availability: Boolean
  }

  input PriceRangeInput {
    min: Float!
    max: Float!
  }

  input DateRangeInput {
    start: String!
    end: String!
  }

  input PaginationInput {
    page: Int! = 1
    pageSize: Int! = 10
  }

  input SortInput {
    field: String!
    direction: String! = "ASC"
  }

  type RatingDistribution {
    rating: Float!
    count: Int!
  }

  type PublisherWithCount {
    publisher: Publisher!
    bookCount: Int!
  }

  type PublisherStats {
    totalPublishers: Int!
    topPublishers: [PublisherWithCount!]!
  }

  type GenreCount {
    genre: Genre!
    count: Int!
  }

  type PriceRangeStats {
    min: Float!
    max: Float!
    average: Float!
  }

  type BookAggregations {
    genreCount: [GenreCount!]!
    priceRange: PriceRangeStats!
    ratingDistribution: [RatingDistribution!]!
    publisherStats: PublisherStats!
  }

  type BookConnection {
    items: [Book!]!
    pageInfo: PageInfo!
    aggregations: BookAggregations!
  }

  type PageInfo {
    totalCount: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    currentPage: Int!
    totalPages: Int!
  }

  type DeletionDetails {
    deletedBy: String!
    deletionType: String!
    reason: String
    canBeRestored: Boolean!
  }

  type Query {
    books(
      filter: BookFilterInput,
      pagination: PaginationInput,
      sort: BookSortingInput,
      ratingThreshold: Float,
      dateRange: DateRangeInput,
      searchQuery: SearchQueryInput
    ): BooksResponse!
    
    book(id: ID!): BookResponse!
  }

  type Mutation {
    createBook(input: BookInput!): BookResponse!
    updateBook(id: ID!, input: BookUpdateInput!): BookResponse!
    deleteBook(id: ID!, softDelete: Boolean, reason: String): DeletionResponse!
  }
`;

module.exports = { typeDefs };