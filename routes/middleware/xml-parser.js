const { parseString } = require('xml2js');

const parseStringToXML = (req, res, next) => {
    // Check if content type is XML
    if (req.headers['content-type'] !== 'application/xml') {
        return res.status(400).json({ error: 'Content type must be application/xml' });
    }

    let xmlBody = '';
    
    req.on('data', chunk => {
        xmlBody += chunk.toString();
    });

    req.on('end', () => {
        parseString(xmlBody, { 
            trim: true, 
            explicitArray: false,
            mergeAttrs: true,
            // Add these options to handle metadata and attributes
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
                return res.status(400).json({ 
                    error: 'Invalid XML format', 
                    details: err.message 
                });
            }

            console.log('Raw Parsed XML result:', JSON.stringify(result, null, 2));

            // Attach parsed XML to the request
            req.xmlBody = xmlBody;
            req.body = result;
            next();
        });
    });
};

const convertToXML = (data) => {
    const builder = require('xmlbuilder');
    const root = builder.create('data');
    
    Object.entries(data).forEach(([key, value]) => {
        root.ele(key, value);
    });

    return root.end({ pretty: true });
};

module.exports = { 
    parseStringToXML,
    convertToXML 
};