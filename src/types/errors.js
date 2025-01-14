const ErrorCodes = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR'
};

class BookError extends Error {
    constructor(message, code, field) {
        super(message);
        this.code = code;
        this.field = field;
    }

    static mapErrorToStatus(errorCode) {
        const statusMap = {
            [ErrorCodes.VALIDATION_ERROR]: 400,
            [ErrorCodes.NOT_FOUND]: 404,
            [ErrorCodes.PERMISSION_DENIED]: 403,
            [ErrorCodes.TIMEOUT_ERROR]: 408,
            [ErrorCodes.INTERNAL_ERROR]: 500
        };
        return statusMap[errorCode] || 500;
    }

    static formatError(error) {
        return {
            data: null,
            error: {
                message: error.message,
                code: error.code || ErrorCodes.INTERNAL_ERROR,
                field: error.field
            }
        };
    }
}

module.exports = { ErrorCodes, BookError };