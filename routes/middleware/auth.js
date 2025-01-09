const jwt = require('jsonwebtoken');
const { User } = require('../../models');
const { JWT_SECRET } = process.env;

const handleAuthResponse = (res, shouldRedirect, redirectPath, statusCode, errorMessage, details = {}) => {

    if (shouldRedirect === true) {
        res.setHeader('Location', redirectPath);
        return res.status(302).end();
    }

    return res.status(statusCode).json({ 
        error: errorMessage,
        ...details 
    });
};

const authenticateToken = async (req, res, next) => {
    try {
        const shouldRedirect = req.headers['x-handle-redirect'] === 'true';

        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            console.log('No token found');
            return handleAuthResponse(
                res,
                shouldRedirect,
                '/auth/login',
                401,
                'Missing token'
            );
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findByPk(decoded.userId);

            if (!user) {
                return handleAuthResponse(
                    res,
                    shouldRedirect,
                    '/auth/login',
                    401,
                    'Invalid token'
                );
            }

            req.user = {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                isAdmin: user.isAdmin
            };
            
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return handleAuthResponse(
                    res,
                    shouldRedirect,
                    '/auth/login',
                    401,
                    'Token expired'
                );
            }
            return handleAuthResponse(
                res,
                shouldRedirect,
                '/auth/login',
                401,
                'Invalid token'
            );
        }
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({ error: 'Authentication failed' });
    }
};

const isAdmin = async (req, res, next) => {
    try {
        const shouldRedirect = req.headers['x-handle-redirect'] === 'true';

        if (!req.user || !req.user.isAdmin) {
            return handleAuthResponse(
                res,
                shouldRedirect,
                '/auth/unauthorized',
                403,
                'Unauthorized access',
                { message: 'This endpoint requires admin privileges' }
            );
        }
        next();
    } catch (error) {
        console.error('Admin authorization error:', error);
        return res.status(500).json({ error: 'Authorization check failed' });
    }
};

const adminChain = [authenticateToken, isAdmin];

module.exports = {
    authenticateToken,
    isAdmin,
    adminChain
};