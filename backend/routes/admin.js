const express = require('express');
const { protect, isAdmin } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.use(protect, isAdmin);

// Approve worker
router.post('/approve-worker/:id', async (req, res) => {
  const { id } = req.params;
  if (!id || id === 'undefined') {
    return res.status(400).json({ message: 'Invalid worker ID' });
  }
  try {
    const user = await User.findById(id);
    if (!user || user.role !== 'worker') {
      return res.status(404).json({ message: 'Worker not found' });
    }
    if (user.verified) {
      return res.status(400).json({ message: 'Worker already verified' });
    }
    user.verified = true;
    user.availability = true;
    await user.save();
    res.json({ message: 'Worker approved successfully' });
  } catch (error) {
    console.error('Approve worker error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending workers
router.get('/pending-workers', async (req, res) => {
  try {
    const workers = await User.find({ role: 'worker', verified: false });
    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all workers
router.get('/workers', async (req, res) => {
  try {
    const workers = await User.find({ role: 'worker' }).select('-password');
    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (for admin)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all admins
router.get('/admins', async (req, res) => {
  try {
    const Admin = require('../models/Admin');
    const admins = await Admin.find().select('-password');
    res.json(admins);
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject worker (delete)
router.delete('/reject-worker/:id', async (req, res) => {
  const { id } = req.params;
  if (!id || id === 'undefined') {
    return res.status(400).json({ message: 'Invalid worker ID' });
  }
  try {
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    res.json({ message: 'Worker rejected and removed' });
  } catch (error) {
    console.error('Reject worker error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all bookings for admin
router.get('/bookings', async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const bookings = await Booking.find({})
      .populate('userId', 'name email')
      .populate('workerId', 'name profession')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all leave requests for admin
router.get('/leave-requests', async (req, res) => {
  try {
    const LeaveRequest = require('../models/LeaveRequest');
    const leaveRequests = await LeaveRequest.find({})
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(leaveRequests);
  } catch (error) {
    console.error('Get all leave requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
