const { CREATE_BOOK } = require('../data/api/queries/createBook');
const { GET_BOOK } = require('../data/api/queries/getBook');
const { UPDATE_BOOK } = require('../data/api/queries/updateBook');
const { DELETE_BOOK } = require('../data/api/queries/deleteBook');
const { FILTER_BOOKS } = require('../data/api/queries/filterBook');

class BookPage {
    constructor(request) {
        this.request = request;
        this.endpoint = 'http://localhost:4000/graphql';
        this.apiKey = null;
        this.defaultTimeout = 5000;
    }

    setApiKey(apiKey) {
        if (!apiKey) {
            throw new Error('API key is required');
        }
        this.apiKey = apiKey;
    }

    extractError(data, response) {
        if (data.errors?.[0]?.extensions) {
            const error = data.errors[0];
            return {
                message: error.message,
                code: error.extensions.code,
                field: error.extensions.field
            };
        }

        // Handle HTTP errors
        switch(response.status()) {
            case 400:
                return { message: 'Bad Request', code: 'VALIDATION_ERROR' };
            case 401:
                return { message: 'Authentication required', code: 'UNAUTHORIZED' };
            case 403:
                return { message: data.errors?.[0]?.message || 'Invalid API key', code: 'FORBIDDEN' };
            case 404:
                return { message: 'Resource not found', code: 'NOT_FOUND' };
            case 408:
                return { message: `Operation timeout: exceeded ${this.defaultTimeout}ms`, code: 'TIMEOUT_ERROR' };
            default:
                return { message: 'Internal server error', code: 'INTERNAL_ERROR' };
        }
    }

    async sendQuery(query, variables = {}) {
        if (!this.apiKey) {
            throw new Error('API key must be set before making requests');
        }

        try {
            const response = await this.request.post(this.endpoint, {
                headers: {
                    'x-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                data: {
                    query,
                    variables
                },
                timeout: this.defaultTimeout
            });
            
            const data = await response.json();
            const status = response.status();
            //console.log('Response status:', response.status());
            //console.log('Response data:', JSON.stringify(data, null, 2));
            
            if (!response.ok()) {
                return {
                    data: null,
                    error: this.extractError(data, response),
                    status
                };
            }
    
            if (data.errors) {
                const error = data.errors[0];
                return {
                    data: null,
                    error: {
                        message: error.message,
                        code: error.code || error.extensions?.code ||  'INTERNAL_ERROR',
                        field: error.field || error.extensions?.field
                    },
                    status
                };
            }
    
            return { data: data.data, error: null, status };
        } catch (error) {
            
            if (error.message.includes('Request timed out')) {
                return {
                    data: null,
                    error: {
                        message: `Operation timeout: exceeded ${this.defaultTimeout}ms`,
                        code: 'TIMEOUT_ERROR'
                    }
                };
            }
            return {
                data: null,
                error: {
                    message: error.message,
                    code: 'INTERNAL_ERROR'
                }
            };
        }
    }

    // CRUD methods remain the same but now correctly handle the response structure
    async createBook(bookData) {
        const { data, error } = await this.sendQuery(CREATE_BOOK, bookData);
        return error ? Promise.reject(error) : data.createBook;
    }

    async getBook(params) {
        const { data, error } = await this.sendQuery(GET_BOOK, params);
        return error ? Promise.reject(error) : data.book;
    }

    async updateBook({ bookId, updateData }) {
        const { data, error } = await this.sendQuery(UPDATE_BOOK, {
            bookId,
            updateData
        });
        return error ? Promise.reject(error) : data.updateBook;
    }

    async deleteBook(params) {
        const { data, error } = await this.sendQuery(DELETE_BOOK, params);
        return error ? Promise.reject(error) : data.deleteBook;
    }

    async filterBooks(filterCriteria) {
        const { data, error } = await this.sendQuery(FILTER_BOOKS, filterCriteria);
        return error ? Promise.reject(error) : data.books;
    }
}

module.exports = BookPage;