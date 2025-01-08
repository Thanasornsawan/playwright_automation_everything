const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./middleware/auth');
const { validateProduct, validateReview } = require('./middleware/validators');
const { Product, Review } = require('../models');
const { isUUID } = require('./utils/validators');
const { v4: uuidv4 } = require('uuid');

// Get all products
router.get('/', authenticateToken, async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // Validate UUID format
    if (!isUUID(req.params.id)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }

    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Seed products (for testing)
router.post('/seed', authenticateToken, async (req, res) => {
  try {
    const currentTimestamp = new Date();
    const sampleProducts = [
      {
        id: uuidv4(), // Generate unique ID
        name: 'Sample Product 1',
        description: 'Description for product 1',
        price: 19.99,
        stock: 100,
        category: 'Category 1',
        tags: ['tag1', 'tag2'],
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp
      },
      {
        id: uuidv4(), // Generate unique ID
        name: 'Sample Product 2',
        description: 'Description for product 2',
        price: 29.99,
        stock: 50,
        category: 'Category 2',
        tags: ['tag2', 'tag3'],
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp
      }
    ];

    const products = await Product.bulkCreate(sampleProducts, {
      fields: ['id', 'name', 'description', 'price', 'stock', 'category', 'tags', 'createdAt', 'updatedAt']
    });

    res.status(201).json(products);
  } catch (error) {
    console.error('Product seeding error:', error);
    res.status(500).json({ error: 'Failed to seed products', details: error.message });
  }
});

// Create review
router.post('/:productId/reviews', authenticateToken, validateReview, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    const product = await Product.findByPk(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const review = await Review.create({
      rating,
      comment,
      UserId: req.user.id,
      ProductId: req.params.productId,
    });

    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Update review
router.put('/:productId/reviews/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    // Find the review by ID
    const review = await Review.findOne({
      where: {
        id: req.params.reviewId,
        ProductId: req.params.productId,
      },
    });

    //console.log('Review found:', review); // Add log here to check UserId

    if (!review) {
      return res.status(404).json({ error: 'Review not found for the specified product' });
    }

    // Ensure the user updating the review is the owner
    if (review.UserId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: Cannot update another user’s review' });
    }

    // Update the review fields
    if (rating) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Invalid rating: Must be between 1 and 5' });
      }
      review.rating = rating;
    }

    if (comment) {
      review.comment = comment;
    }

    //console.log('Review after update:', review); // Add log here to check UserId after update

    await review.save();
    res.json(review);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Delete review
router.delete('/:productId/reviews/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { productId, reviewId } = req.params;

    // Validate UUID format for productId and reviewId
    if (!isUUID(productId) || !isUUID(reviewId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Find the review by ID and ensure it belongs to the specified product
    const review = await Review.findOne({
      where: {
        id: reviewId,
        ProductId: productId,
      },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found for the specified product' });
    }

    // Ensure the user deleting the review is the owner
    if (review.UserId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: Cannot delete another user’s review' });
    }

    // Delete the review
    await review.destroy();

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

module.exports = router;