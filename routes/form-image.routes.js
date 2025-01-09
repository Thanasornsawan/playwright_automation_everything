const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const { authenticateToken } = require('./middleware/auth');

// Memory storage for transient image processing
const upload = multer({ 
    storage: multer.memoryStorage(),
    // Remove file size limit for form data
    limits: {}
});

// Image validation middleware
const validateImage = async (req, res, next) => {
    // Check if file exists
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Allowed image types
    const ALLOWED_MIME_TYPES = [
        'image/jpeg', 
        'image/png', 
        'image/gif', 
        'image/webp'
    ];

    // Validate mime type
    if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
        return res.status(400).json({ 
            error: 'Invalid file type',
            allowedTypes: ALLOWED_MIME_TYPES,
            currentType: req.file.mimetype
        });
    }

    try {
        // Additional validation using Sharp
        const metadata = await sharp(req.file.buffer).metadata();
        
        // Optional: Add image dimension constraints
        if (metadata.width > 3000 || metadata.height > 3000) {
            return res.status(400).json({ 
                error: 'Image dimensions too large',
                maxDimensions: '3000x3000',
                currentDimensions: `${metadata.width}x${metadata.height}`
            });
        }

        // Attach metadata for potential further use
        req.imageMetadata = metadata;
        next();
    } catch (error) {
        return res.status(400).json({ 
            error: 'Invalid image file', 
            details: error.message 
        });
    }
};

// File upload endpoint with validation
router.post('/upload-image', 
    authenticateToken, 
    upload.single('image'), 
    validateImage, 
    (req, res) => {
        res.json({
            message: 'Image uploaded successfully',
            filename: req.file.originalname,
            size: req.file.size,
            dimensions: {
                width: req.imageMetadata.width,
                height: req.imageMetadata.height
            },
            mimeType: req.file.mimetype
        });
    }
);

// Form data endpoint (stateless validation)
router.post('/form-data', 
    authenticateToken, 
    (req, res) => {
        console.log('Received body:', req.body);

        const { username, email, age } = req.body;
        
        // Basic validation without DB dependency
        const errors = [];
        
        // Username validation
        if (!username || username.trim().length < 3) {
            errors.push('Username must be at least 3 characters');
        }
        
        // Email validation
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push('Invalid email format');
        }
        
        // Age validation
        const parsedAge = parseInt(age);
        if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 120) {
            errors.push('Invalid age (must be between 18 and 120)');
        }
        
        if (errors.length > 0) {
            return res.status(400).json({ 
                error: 'Validation failed',
                errors: errors 
            });
        }
        
        res.json({
            message: 'Form data received successfully',
            data: {
                username,
                email,
                age: parsedAge
            }
        });
    }
);

module.exports = router;