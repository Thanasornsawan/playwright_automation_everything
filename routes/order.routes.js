const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./middleware/auth');
const { validateOrder } = require('./middleware/validators');
const { Order, OrderItem, Product, User } = require('../models');
const { isUUID } = require('./utils/validators');
const { sequelize } = require('../models');

// Create order
router.post('/', authenticateToken, async (req, res) => {
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

// Get order by ID
router.get('/:id', authenticateToken, async (req, res) => {
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

// Update order status
router.patch('/:id', authenticateToken, async (req, res) => {
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

// Delete order items
router.delete('/:id/items', authenticateToken, async (req, res) => {
  try {
    await OrderItem.destroy({
      where: { OrderId: req.params.id }
    });
    res.status(200).json({ message: 'Order items deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete order items' });
  }
});

// Delete order
router.delete('/:id', authenticateToken, async (req, res) => {
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

module.exports = router;