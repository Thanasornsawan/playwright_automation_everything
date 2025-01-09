const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./middleware/auth');
const { parseStringToXML } = require('./middleware/xml-parser');
const { parseString, Builder } = require('xml2js');

// Advanced XML processing middleware
const processXMLData = (req, res, next) => {
    const parsedRequest = req.body || {};
    //console.log('Full parsedRequest:', JSON.stringify(parsedRequest, null, 2));
    
    let operation = 'default';
    
    if (parsedRequest.request) {
        if (parsedRequest.request.$ && parsedRequest.request.$.type) {
            operation = parsedRequest.request.$.type;
        } else if (parsedRequest.request.type) {
            operation = parsedRequest.request.type;
        }
    }
    
    //console.log('Extracted operation:', operation);

    const processedData = {
        operation: operation,
        items: []
    };

    const requestItems = parsedRequest.request 
        ? parsedRequest.request.item 
        : [];
    
    const items = Array.isArray(requestItems) 
        ? requestItems 
        : requestItems 
            ? [requestItems] 
            : [];

    processedData.items = items.map(item => ({
        id: item.$ ? item.$.id || item.id || '' : item.id || '',
        name: item.name || '',
        status: item.$ ? item.$.status || item.status || 'pending' : item.status || 'pending',
        priority: item.$ ? parseInt(item.$.priority) || parseInt(item.priority) || 0 : parseInt(item.priority) || 0,
        metadata: item.metadata || {},
        originalAttributes: item.$ || {}
    }));

    //console.log('Processed Data:', JSON.stringify(processedData, null, 2));

    req.processedXML = processedData;
    next();
};

// Advanced XML endpoint with complex processing
router.post('/advanced-xml', 
    authenticateToken, 
    parseStringToXML, 
    processXMLData, 
    (req, res) => {
        const { operation, items } = req.processedXML;

        // Validate and filter items based on operation
        let filteredItems = items;
        let error = null;
        //console.log('operation:', operation);

        switch(operation) {
            case 'filter-high-priority':
                filteredItems = items.filter(item => 
                    item.priority >= 8 && item.status === 'active'
                );
                //console.log('enter case filter-high-priority');
                break;
            case 'transform':
                filteredItems = items.map(item => {
                    const newStatus = item.priority > 5 ? 'critical' : item.status;
                    return {
                        ...item,
                        status: newStatus,
                        originalAttributes: {
                            ...item.originalAttributes,
                            status: newStatus
                        }
                    };
                });
                //console.log('enter case transform');
                break;
            case 'validate':
                const validationErrors = items.filter(item => 
                    !item.name || item.priority < 0 || item.priority > 10
                );
                
                if (validationErrors.length > 0) {
                    error = {
                        error: 'Validation failed',
                        invalidItems: validationErrors
                    };
                }
                //console.log('enter case validate');
                break;
        }
        //console.log('filteredItems:', filteredItems);
        // If there's an error during validation, return JSON error
        if (error) {
            return res.status(400).json(error);
        }

        // Create XML response
        const xmlBuilder = new Builder({ 
            rootName: 'response',
            headless: false,
            renderOpts: { pretty: true },
            xmldec: { version: '1.0', encoding: 'UTF-8' },
            attrkey: '$',
            charkey: '_'
        });

        const responseData = {
            $: { 
                operation: req.processedXML.operation,
                timestamp: new Date().toISOString()
            },
            items: {
                // Ensure item is always an array
                item: filteredItems.map(item => ({
                    $: {
                        id: item.id,
                        status: item.status,
                        priority: item.priority.toString()
                    },
                    name: item.name,
                    metadata: JSON.stringify(item.metadata)
                }))
            }
        };

        // Set content type to XML explicitly
        res.set('Content-Type', 'application/xml');
        
        // Send XML response
        const xmlResponse = xmlBuilder.buildObject(responseData);
        res.send(xmlResponse);
    }
);

module.exports = router;