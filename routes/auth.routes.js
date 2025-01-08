const express = require('express');
const router = express.Router();
const { validateUser } = require('./middleware/validators');
const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

// Auth routes
router.post('/register', validateUser, async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, isAdmin = false } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      isAdmin
    });

    res.status(201).json({ 
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin 
    });

  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Email already registered' });
    } else if (error.name === 'SequelizeValidationError') {
      res.status(400).json({ error: 'Invalid input data', details: error.errors });
    } else {
      next(error);
    }
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        userId: user.id,
        isAdmin: user.isAdmin
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/unauthorized', (req, res) => {
  res.status(403).json({
      error: 'Unauthorized access',
      message: 'This endpoint requires admin privileges',
      redirected: true
  });
});

// Login page endpoint
router.get('/login', (req, res) => {
  res.status(200).json({
      message: 'Please login to continue',
      redirected: true
  });
});

module.exports = router;