const DELETE_BOOK = `
  mutation DeleteBookOperation($id: ID!, $softDelete: Boolean = false, $reason: String) {
    deleteBook(id: $id, softDelete: $softDelete, reason: $reason) {
      success
      message
      deletedBookId
      timestamp
      deletionDetails {
        deletedBy
        deletionType
        reason
        canBeRestored
      }
      error {
        message
        code
        field
      }
    }
  }
`;

module.exports = { DELETE_BOOK };