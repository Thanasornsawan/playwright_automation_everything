const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./middleware/auth');
const { validateProfile } = require('./middleware/validators');
const { User, Profile, Order, OrderItem } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../models');

// Get user profile
router.get('/:id/profile', authenticateToken, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      where: { UserId: req.params.id }
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
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

// Create/Update user profile
router.post('/:id/profile', authenticateToken, validateProfile, async (req, res) => {
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

// Delete user profile
router.delete('/:id/profile', authenticateToken, async (req, res) => {
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

// Delete user and all associated data
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

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

module.exports = router;