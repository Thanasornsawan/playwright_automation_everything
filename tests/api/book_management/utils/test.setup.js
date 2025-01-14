const { test, expect } = require('@playwright/test');
const BookPage = require('../../../../api/bookPage');
const bookPayload = require('../../../../data/api/book_payload.json');

async function setupTestAPI(request) {
    const bookAPI = new BookPage(request);
    bookAPI.setApiKey('test-api-key-123');
    return bookAPI;
}

expect.extend({
    async toHaveSuccessfulStatus(received, expectedStatus, message = 'Operation') {
        const status = received.status;
        const pass = status === expectedStatus;
        
        const resultMessage = pass 
            ? `${message} successful with status ${status}`
            : `Expected status ${expectedStatus} but received ${status}`;
            
        test.info().annotations.push({ type: 'info', description: resultMessage });
        return { pass, message: () => resultMessage };
    }
});

module.exports = {
    setupTestAPI,
    bookPayload
};