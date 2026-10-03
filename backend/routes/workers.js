const express = require('express');
const { protect } = require('../middleware/auth');
const { pool, toApi } = require('../db');

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const conditions = ['role = ?', 'verified = TRUE', 'availability = TRUE'];
    const values = ['worker'];
    if (req.query.profession) {
      conditions.push('profession = ?');
      values.push(req.query.profession);
    }
    if (req.query.location) {
      conditions.push('location = ?');
      values.push(req.query.location);
    }
    const [rows] = await pool.execute(
      `SELECT * FROM users WHERE ${conditions.join(' AND ')} ORDER BY rating DESC`,
      values
    );
    return res.json(rows.map((row) => {
      const worker = toApi(row);
      delete worker.password;
      return worker;
    }));
  } catch (error) {
    console.error('Get workers error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/all', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE role = ? AND verified = TRUE ORDER BY rating DESC',
      ['worker']
    );
    return res.json(rows.map((row) => {
      const worker = toApi(row);
      delete worker.password;
      return worker;
    }));
  } catch (error) {
    console.error('Get all workers error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ? AND role = ? AND verified = TRUE LIMIT 1',
      [req.params.id, 'worker']
    );
    if (!rows[0]) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    const worker = toApi(rows[0]);
    delete worker.password;
    return res.json(worker);
  } catch (error) {
    console.error('Get worker error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
