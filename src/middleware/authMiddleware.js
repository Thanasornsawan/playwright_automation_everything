const VALID_API_KEYS = {
    'test-api-key-123': {
        role: 'admin',
        permissions: ['read', 'write', 'delete']
    },
    'test-api-key-readonly': {
        role: 'reader',
        permissions: ['read']
    }
};

function getOperationType(query) {
    const trimmedQuery = query.trim().toLowerCase();
    if (trimmedQuery.startsWith('mutation')) {
        return 'write';
    }
    if (trimmedQuery.startsWith('query')) {
        return 'read';
    }
    // Default to write for safety
    return 'write';
}

function validateApiKey(apiKey) {
    return VALID_API_KEYS[apiKey] || null;
}

function authMiddleware(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
        return res.status(401).json({
            errors: [{
                message: 'API key is required',
                extensions: {
                    code: 'UNAUTHORIZED'
                }
            }]
        });
    }

    const apiKeyDetails = validateApiKey(apiKey);
    if (!apiKeyDetails) {
        return res.status(403).json({
            errors: [{
                message: 'Invalid API key',
                extensions: {
                    code: 'FORBIDDEN'
                }
            }]
        });
    }

    // Check operation permissions
    if (req.body?.query) {
        const operationType = getOperationType(req.body.query);
        if (!apiKeyDetails.permissions.includes(operationType)) {
            return res.status(403).json({
                errors: [{
                    message: 'Insufficient permissions',
                    extensions: {
                        code: 'FORBIDDEN'
                    }
                }]
            });
        }
    }

    req.apiKeyDetails = apiKeyDetails;
    next();
}

module.exports = { authMiddleware, validateApiKey };