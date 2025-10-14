const express = require('express');
const { protect, isAdmin } = require('../middleware/auth');
const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');

const router = express.Router();

router.use(protect);

// Get leave requests (worker: own; admin: all)
router.get('/', async (req, res) => {
  try {
    const role = req.user.role;
    let leaveRequests;

    if (role === 'admin') {
      leaveRequests = await LeaveRequest.find({})
        .populate('workerId', 'name email')
        .sort({ appliedAt: -1 });
    } else if (role === 'worker') {
      leaveRequests = await LeaveRequest.find({ workerId: req.user._id })
        .sort({ appliedAt: -1 });
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(leaveRequests);
  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new leave request (worker only)
router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'worker') {
      return res.status(403).json({ message: 'Only workers can create leave requests' });
    }

    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'Start date, end date, and reason required' });
    }

    const leaveRequest = new LeaveRequest({
      workerId: req.user._id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason
    });

    await leaveRequest.save();

    // Notify admin (assuming single admin or all admins; here, create for a default admin if needed, but skip for simplicity)
    res.status(201).json(leaveRequest);
  } catch (error) {
    console.error('Create leave request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin approve leave request
router.put('/admin/:id/approve', protect, isAdmin, async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Leave request cannot be approved' });
    }

    leaveRequest.status = 'approved';
    await leaveRequest.save();

    // Notify worker
    const worker = await User.findById(leaveRequest.workerId);
    await new Notification({
      recipientId: leaveRequest.workerId,
      senderId: req.user._id,
      message: `Your leave request from ${leaveRequest.startDate.toDateString()} to ${leaveRequest.endDate.toDateString()} has been approved`,
      type: 'leave'
    }).save();

    res.json(leaveRequest);
  } catch (error) {
    console.error('Approve leave request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin reject leave request
router.put('/admin/:id/reject', protect, isAdmin, async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Leave request cannot be rejected' });
    }

    leaveRequest.status = 'rejected';
    await leaveRequest.save();

    // Notify worker
    const worker = await User.findById(leaveRequest.workerId);
    await new Notification({
      recipientId: leaveRequest.workerId,
      senderId: req.user._id,
      message: `Your leave request from ${leaveRequest.startDate.toDateString()} to ${leaveRequest.endDate.toDateString()} has been rejected`,
      type: 'leave'
    }).save();

    res.json(leaveRequest);
  } catch (error) {
    console.error('Reject leave request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
