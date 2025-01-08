const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./middleware/auth');
const { validateProduct, validateReview } = require('./middleware/validators');
const { Product, Review } = require('../models');
const { isUUID } = require('./utils/validators');
const { v4: uuidv4 } = require('uuid');

// Delete all reviews
router.delete('/', authenticateToken, async (req, res) => {
  try {
    // Delete all reviews
    await Review.destroy({ where: {} });

    res.status(200).json({ message: 'All reviews deleted successfully' });
  } catch (error) {
    console.error('Error deleting all reviews:', error);
    res.status(500).json({ error: 'Failed to delete all reviews' });
  }
});

module.exports = router;