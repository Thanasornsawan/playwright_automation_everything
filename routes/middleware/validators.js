const { check, validationResult } = require('express-validator');

// User validation rules
const validateUser = [
    check('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Must be a valid email address'),
    check('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long'),
    check('firstName')
        .trim()
        .notEmpty()
        .withMessage('First name is required'),
    check('lastName')
        .trim()
        .notEmpty()
        .withMessage('Last name is required'),
    check('isAdmin')
        .optional()
        .isBoolean()
        .withMessage('isAdmin must be a boolean value'),
    // Middleware to handle validation results
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation Error', 
                details: errors.array() 
            });
        }
        next();
    }
];

// Profile validation rules
const validateProfile = [
    check('phoneNumber')
        .optional()
        .matches(/^\+?[\d\s-]+$/)
        .withMessage('Invalid phone number format'),
    check('address')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Address cannot be empty if provided'),
    check('preferences')
        .optional()
        .isObject()
        .withMessage('Preferences must be an object'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation Error', 
                details: errors.array() 
            });
        }
        next();
    }
];

// Product validation rules
const validateProduct = [
    check('name')
        .trim()
        .notEmpty()
        .withMessage('Product name is required'),
    check('description')
        .trim()
        .notEmpty()
        .withMessage('Product description is required'),
    check('price')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    check('stock')
        .isInt({ min: 0 })
        .withMessage('Stock must be a non-negative integer'),
    check('category')
        .trim()
        .notEmpty()
        .withMessage('Category is required'),
    check('tags')
        .isArray()
        .withMessage('Tags must be an array'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation Error', 
                details: errors.array() 
            });
        }
        next();
    }
];

// Review validation rules
const validateReview = [
    check('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    check('comment')
        .trim()
        .notEmpty()
        .withMessage('Review comment is required'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation Error', 
                details: errors.array() 
            });
        }
        next();
    }
];

// Order validation rules
const validateOrder = [
    check('items')
        .isArray({ min: 1 })
        .withMessage('Order must contain at least one item'),
    check('items.*.productId')
        .notEmpty()
        .withMessage('Product ID is required for each item'),
    check('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1 for each item'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation Error', 
                details: errors.array() 
            });
        }
        next();
    }
];

module.exports = {
    validateUser,
    validateProfile,
    validateProduct,
    validateReview,
    validateOrder
};