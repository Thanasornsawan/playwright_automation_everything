const fs = require('fs');

class FormImageTransactionPage {
    constructor(apiContext, baseUrl) {
        this.apiContext = apiContext;
        this.baseUrl = baseUrl;
    }

    async uploadImage(token, imagePath) {
        return this.apiContext.post(`${this.baseUrl}/transactions/upload-image`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            multipart: {
                image: fs.createReadStream(imagePath)
            }
        });
    }

    async sendFormData(token, data) {
        //console.log('Sending form data:', data);
        
        const response = await this.apiContext.post(`${this.baseUrl}/transactions/form-data`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            form: data
        });
    
        //console.log('Response status:', response.status());
        const responseBody = await response.text();
        //console.log('Response body:', responseBody);
    
        return response;
    }
}

module.exports = FormImageTransactionPage;