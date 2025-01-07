require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { check } = require('express-validator');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { sequelize } = require('./models');

// Environment variables
const PORT = process.env.API_SERVER_PORT;
const JWT_SECRET = process.env.JWT_SECRET;

// Initialize Express app
const app = express();

// Middleware
app.use(helmet());
app.use(bodyParser.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Import models
const { User, Profile, Product, Order, OrderItem, Review } = require('./models');

const isUUID = (str) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Validation middleware
const validateUser = [
  check('email').isEmail().normalizeEmail(),
  check('password').isLength({ min: 8 }),
  check('firstName').trim().notEmpty(),
  check('lastName').trim().notEmpty()
];

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Missing token' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    //console.log('Authenticated User:', req.user);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Auth routes
app.post('/auth/register', validateUser, async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName
    });

    res.status(201).json({ userId: user.id });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Email already registered' });
    } else {
      next(error);
    }
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    next(error);
  }
});

// Product routes
app.get('/products', authenticateToken, async (req, res) => {
  const products = await Product.findAll();
  res.json(products);
});

// Product seeding route for testing
app.post('/products/seed', authenticateToken, async (req, res) => {
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

app.get('/products/:id', authenticateToken, async (req, res) => {
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

// Create order with proper userId handling
app.post('/orders', authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid order: No items provided' });
    }

    // Log the user ID to verify it's present
    console.log('Creating order for user:', req.user.id);

    let totalAmount = 0;
    const productsWithDetails = []; // Array to store product details for order items

    for (const item of items) {
      if (!item.productId || !item.quantity) {
        return res.status(400).json({ error: 'Invalid order item: Missing productId or quantity' });
      }

      const product = await Product.findByPk(item.productId);
      if (!product) {
        return res.status(400).json({ error: `Product with ID ${item.productId} not found` });
      }

      totalAmount += product.price * item.quantity;

      // Store product details with item information
      productsWithDetails.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtTime: product.price,
      });
    }

    const order = await Order.create({
      UserId: req.user.id, 
      status: 'pending',
      totalAmount,
      shippingAddress: 'Default shipping address',
    }, { transaction });

    // Use stored product details to create OrderItems
    await Promise.all(productsWithDetails.map(item =>
      OrderItem.create({
        OrderId: order.id,
        ProductId: item.productId,
        quantity: item.quantity,
        priceAtTime: item.priceAtTime, 
      }, { transaction })
    ));

    await transaction.commit();

    // Fetch the complete order with associations
    const completeOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem }],
    });

    res.status(201).json(completeOrder);
  } catch (error) {
    await transaction.rollback();
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order', details: error.message });
  }
});

// Delete order items
app.delete('/orders/:id/items', authenticateToken, async (req, res) => {
  try {
    await OrderItem.destroy({
      where: { OrderId: req.params.id }
    });
    res.status(200).json({ message: 'Order items deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete order items' });
  }
});

// Get order by ID
app.get('/orders/:id', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.id;

    // Validate UUID format for the order ID
    if (!isUUID(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID format' });
    }

    // Find the order with associated items and user details
    const order = await Order.findByPk(orderId, {
      include: [
        { model: OrderItem }, // Include associated order items
        { model: User, attributes: ['id', 'email', 'firstName', 'lastName'] } // Include user details
      ],
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Delete order
app.delete('/orders/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    await order.destroy();
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Delete user profile
app.delete('/users/:id/profile', authenticateToken, async (req, res) => {
  try {
    const profile = await Profile.findOne({ where: { UserId: req.params.id } });
    if (profile) {
      await profile.destroy();
    }
    res.status(200).json({ message: 'Profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete profile' });
  }
});

app.delete('/users/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Start transaction only for the delete operation
    await sequelize.transaction(async (transaction) => {
      await Profile.destroy({ where: { UserId: req.params.id }, transaction });
      await OrderItem.destroy({ 
        where: {
          OrderId: {
            [Op.in]: sequelize.literal(`(SELECT id FROM "Orders" WHERE "UserId" = '${req.params.id}')`)
          }
        },
        transaction
      });
      await Order.destroy({ where: { UserId: req.params.id }, transaction });
      await user.destroy({ transaction });
    });

    res.status(200).json({ message: 'User and associated data deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user and associated data' });
  }
});

// Get user profile
app.get('/users/:id/profile', authenticateToken, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      where: { UserId: req.params.id }
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Only return the profile data that matches the original structure
    const profileData = {
      phoneNumber: profile.phoneNumber,
      address: profile.address,
      preferences: profile.preferences
    };
    
    res.json(profileData);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// POST /users/:id/profile
app.post('/users/:id/profile', authenticateToken, async (req, res) => {
  try {
    const { phoneNumber, address, preferences } = req.body;

    const [profile, created] = await Profile.findOrCreate({
      where: { UserId: req.params.id },
      defaults: { phoneNumber, address, preferences },
    });

    if (!created) {
      await profile.update({ phoneNumber, address, preferences });
    }

    res.status(created ? 201 : 200).json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create or update profile' });
  }
});

// Order Endpoints
app.patch('/orders/:id', authenticateToken, async (req, res) => {
  try {
    const { status, shippingAddress } = req.body;

    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update allowed fields
    if (status) {
      if (!['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      order.status = status;
    }

    if (shippingAddress) {
      order.shippingAddress = shippingAddress;
    }

    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// POST /products/:productId/reviews
app.post('/products/:productId/reviews', authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    // Validate the product exists
    const product = await Product.findByPk(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Create a review
    const review = await Review.create({
      rating,
      comment,
      UserId: req.user.id, // Assuming the user is authenticated
      ProductId: req.params.productId,
    });

    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// PUT /products/:productId/reviews/:reviewId
app.put('/products/:productId/reviews/:reviewId', authenticateToken, async (req, res) => {
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
app.delete('/products/:productId/reviews/:reviewId', authenticateToken, async (req, res) => {
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

// Delete all reviews
app.delete('/reviews', authenticateToken, async (req, res) => {
  try {
    // Delete all reviews
    await Review.destroy({ where: {} });

    res.status(200).json({ message: 'All reviews deleted successfully' });
  } catch (error) {
    console.error('Error deleting all reviews:', error);
    res.status(500).json({ error: 'Failed to delete all reviews' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server and sync database
console.log('Before sequelize.sync()');
sequelize.sync({ force: true }).then(() => {
  console.log('Database synced');
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}).catch((error) => {
  console.error('Error syncing database:', error);
});
