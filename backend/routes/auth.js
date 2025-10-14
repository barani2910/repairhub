const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

const router = express.Router();

// Register for user/worker
router.post('/register', async (req, res) => {
  const { name, email, password, role, phone, address, profession, location, hourlyRate, skills, experience } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (!['user', 'worker'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      address: role === 'user' ? address : undefined,
      profession: role === 'worker' ? profession : undefined,
      location: role === 'worker' ? location : undefined,
      hourlyRate: role === 'worker' ? hourlyRate : undefined,
      skills: role === 'worker' ? skills : undefined,
      experience: role === 'worker' ? experience : undefined,
      verified: role === 'worker' ? false : true, // users are verified by default, workers need approval
      availability: role === 'worker' ? false : true
    });

    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login for all
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    let user = await User.findOne({ email });
    let isAdmin = false;
    if (!user) {
      user = await Admin.findOne({ email });
      isAdmin = true;
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role || 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Return user data without password
    const { password: _, ...userData } = user.toObject();
    res.json({ user: userData, token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
