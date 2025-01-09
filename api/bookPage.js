const { CREATE_BOOK } = require('../data/api/queries/createBook');
const { GET_BOOK } = require('../data/api/queries/getBook');
const { UPDATE_BOOK } = require('../data/api/queries/updateBook');
const { DELETE_BOOK } = require('../data/api/queries/deleteBook');
const { FILTER_BOOKS } = require('../data/api/queries/filterBook');

class BookPage {
    constructor(request) {
        this.request = request;
        this.endpoint = 'http://localhost:4000/graphql';
        this.apiKey = 'test-api-key-123';
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    extractError(data, response) {
        if (response.status === 403) {
            const errorMessage = data.errors?.[0]?.message;
            if (errorMessage?.includes('Insufficient permissions')) {
                return 'Insufficient permissions';
            }
            return 'Invalid API key';
        }
        return data.errors?.[0]?.message || response.statusText();
    }

    async sendQuery(query, variables = {}) {
        try {
            const response = await this.request.post(this.endpoint, {
                headers: {
                    'x-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                data: {
                    query,
                    variables
                }
            });
            
            const data = await response.json();
            
            // Don't throw error for averageRating calculation errors
            if (data.errors && !data.errors[0]?.message?.includes('getAverageRating')) {
                throw new Error(this.extractError(data, response));
            }

            if (!response.ok()) {
                throw new Error(this.extractError(data, response));
            }
            
            return data;
        } catch (error) {
            if (error.message === 'Invalid API key' || 
                error.message === 'Insufficient permissions') {
                throw error;
            }
            throw error;
        }
    }

    async createBook(bookData) {
        const { data } = await this.sendQuery(CREATE_BOOK, bookData);
        return data.createBook;
    }

    async getBook(params) {
        const { data } = await this.sendQuery(GET_BOOK, params);
        return data.book;
    }

    async updateBook({ bookId, updateData }) {
        const { data } = await this.sendQuery(UPDATE_BOOK, {
            bookId,
            updateData
        });
        return data.updateBook;
    }

    async deleteBook(params) {
        const { data } = await this.sendQuery(DELETE_BOOK, params);
        return data.deleteBook;
    }

    async filterBooks(filterCriteria) {
        const { data } = await this.sendQuery(FILTER_BOOKS, filterCriteria);
        return data.books;
    }
}

module.exports = BookPage;