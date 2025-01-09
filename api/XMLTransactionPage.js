const { parseString } = require('xml2js');

class XMLTransactionPage {
    constructor(apiContext, baseUrl) {
        this.apiContext = apiContext;
        this.baseUrl = baseUrl;
    }

    // Build complex XML with attributes and nested elements
    buildAdvancedXML(operation, items) {
        const xmlItems = items.map(item => {
            const metadataStr = typeof item.metadata === 'object' 
                ? JSON.stringify(item.metadata) 
                : item.metadata || '';
    
            return `<item id="${item.id}" status="${item.status}" priority="${item.priority}">
                <name>${item.name}</name>
                <metadata>${metadataStr}</metadata>
            </item>`;
        }).join('\n');
    
        return `<?xml version="1.0" encoding="UTF-8"?>
        <request type="${operation}">
            ${xmlItems}
        </request>`;
    }

    async sendAdvancedXMLData(token, operation, items) {
        //console.log('Sending XML data:', { operation, items });
    
        const xmlData = this.buildAdvancedXML(operation, items);
        //console.log('Constructed XML:', xmlData);
    
        const response = await this.apiContext.post(`${this.baseUrl}/transactions/advanced-xml`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/xml'
            },
            data: xmlData
        });
    
        //console.log('Response status:', response.status());
        const responseText = await response.text();
        //console.log('Response body:', responseText);
    
        return response;
    }

    // Utility method to parse XML response
    async parseXMLResponse(response) {
        return new Promise((resolve, reject) => {
            parseString(response, { 
                trim: true, 
                explicitArray: false,
                mergeAttrs: true,
                attrkey: '$',
                charkey: '_',
                valueProcessors: [
                    function(value, name) {
                        // Try to parse metadata as JSON
                        if (name === 'metadata' && typeof value === 'string') {
                            try {
                                return JSON.parse(value);
                            } catch (e) {
                                return value;
                            }
                        }
                        return value;
                    }
                ]
            }, (err, result) => {
                if (err) {
                    console.error('XML Parsing Error:', err);
                    reject(err);
                } else {
                    // Normalize single item to array for consistent processing
                    const items = result.response.items.item;
                    result.response.items.item = Array.isArray(items) ? items : [items];
    
                    // Ensure $ attribute exists and contains operation and timestamp
                    if (!result.response.$) {
                        result.response.$ = {
                            operation: result.response.operation || 'default',
                            timestamp: result.response.timestamp || new Date().toISOString()
                        };
                    }
    
                    //console.log('Parsed XML result:', JSON.stringify(result, null, 2));
                    resolve(result);
                }
            });
        });
    }
}

module.exports = XMLTransactionPage;