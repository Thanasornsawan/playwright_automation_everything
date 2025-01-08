const express = require('express');
const router = express.Router();
const { adminChain } = require('./middleware/auth');
const { Product } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { isUUID } = require('./utils/validators');

// Admin product creation
router.post('/products', adminChain, async (req, res) => {
  try {
    const { name, description, price, stock, category, tags } = req.body;
    const currentTimestamp = new Date();
    
    const product = await Product.create({
      id: uuidv4(),
      name,
      description,
      price,
      stock,
      category,
      tags,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp
    }, {
      fields: ['id', 'name', 'description', 'price', 'stock', 'category', 'tags', 'createdAt', 'updatedAt']
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ error: 'Failed to create product', details: error.message });
  }
});

// Admin product deletion
router.delete('/products/:id', adminChain, async (req, res) => {
  try {
    if (!isUUID(req.params.id)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }
    
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    await product.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({ error: 'Failed to delete product', details: error.message });
  }
});

// Admin product update
router.put('/products/:id', adminChain, async (req, res) => {
  try {
    if (!isUUID(req.params.id)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }

    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { name, description, price, stock, category, tags } = req.body;
    const currentTimestamp = new Date();

    await product.update({
      name,
      description,
      price,
      stock,
      category,
      tags,
      updatedAt: currentTimestamp
    }, {
      fields: ['name', 'description', 'price', 'stock', 'category', 'tags', 'updatedAt']
    });

    res.json(product);
  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ error: 'Failed to update product', details: error.message });
  }
});

// Admin inventory management
router.get('/inventory', adminChain, async (req, res) => {
  try {
    // Get threshold from query parameter, default to 10 if not provided
    const threshold = parseInt(req.query.threshold);
    const lowStockThreshold = !isNaN(threshold) ? threshold : 10;

    // Validate threshold is a positive number
    if (lowStockThreshold < 0) {
      return res.status(400).json({
        error: 'Invalid threshold',
        message: 'Threshold must be a positive number',
        timestamp: new Date()
      });
    }

    const products = await Product.findAll({
      where: {
        stock: {
          [Op.lt]: lowStockThreshold
        }
      },
      order: [
        ['stock', 'ASC'] // Order by stock level ascending
      ]
    });

    // Handle case when no products are below threshold
    if (products.length === 0) {
      return res.status(200).json({
        message: `No products found below stock threshold of ${lowStockThreshold}`,
        lowStockItems: [],
        threshold: lowStockThreshold,
        count: 0,
        timestamp: new Date()
      });
    }

    // Success response with products
    res.status(200).json({
      message: `Found ${products.length} products below stock threshold of ${lowStockThreshold}`,
      lowStockItems: products,
      threshold: lowStockThreshold,
      count: products.length,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Inventory check error:', error);
    res.status(500).json({
      error: 'Failed to fetch inventory',
      details: error.message,
      timestamp: new Date()
    });
  }
});

module.exports = router;