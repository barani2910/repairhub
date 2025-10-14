const express = require('express');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.use(protect);

// Get all verified workers (for search/booking)
router.get('/', async (req, res) => {
  try {
    const { profession, location } = req.query;
    let query = { role: 'worker', verified: true, availability: true };

    if (profession) {
      query.profession = profession;
    }
    if (location) {
      query.location = location;
    }

    const workers = await User.find(query)
      .select('-password')
      .sort({ rating: -1 });

    res.json(workers);
  } catch (error) {
    console.error('Get workers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all verified workers without filters (for initial load in search)
router.get('/all', async (req, res) => {
  try {
    const workers = await User.find({ role: 'worker', verified: true })
      .select('-password')
      .sort({ rating: -1 });

    res.json(workers);
  } catch (error) {
    console.error('Get all workers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single worker by ID (for booking form)
router.get('/:id', async (req, res) => {
  try {
    const worker = await User.findOne({ _id: req.params.id, role: 'worker', verified: true })
      .select('-password');

    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    res.json(worker);
  } catch (error) {
    console.error('Get worker error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
