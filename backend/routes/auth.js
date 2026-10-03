const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, newId, toApi } = require('../db');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, password, role, phone, address, profession, location, hourlyRate, skills, experience } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (!['user', 'worker'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existingUsers.length) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.execute(
      `INSERT INTO users
        (id, name, email, password, role, phone, address, profession, location, hourlyRate, skills, experience, verified, availability)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId(), name, email, hashedPassword, role, phone || null,
        role === 'user' ? address || null : null,
        role === 'worker' ? profession || null : null,
        role === 'worker' ? location || null : null,
        role === 'worker' ? hourlyRate || null : null,
        JSON.stringify(role === 'worker' && Array.isArray(skills) ? skills : []),
        role === 'worker' ? experience || null : null,
        role === 'user', role === 'user'
      ]
    );
    return res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    let [rows] = await pool.execute('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    if (!rows[0]) {
      [rows] = await pool.execute('SELECT * FROM admins WHERE email = ? LIMIT 1', [email]);
    }
    const account = rows[0];
    if (!account || !(await bcrypt.compare(password, account.password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }
    const user = toApi(account);
    const token = jwt.sign(
      { id: user._id, role: user.role || 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    delete user.password;
    return res.json({ user, token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
