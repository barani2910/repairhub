const express = require('express');
const { protect } = require('../middleware/auth');
const Booking = require('../models/Booking');
const User = require('../models/User');

const router = express.Router();

router.use(protect);

// Get user's bookings (for users: their bookings; for workers: assigned to them)
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    let bookings;
    if (role === 'admin') {
      bookings = await Booking.find({})
        .populate('userId', 'name email')
        .populate('workerId', 'name profession')
        .sort({ createdAt: -1 });
    } else {
      let query;
      if (role === 'user') {
        query = { userId };
      } else if (role === 'worker') {
        query = { workerId: userId };
      } else {
        return res.status(403).json({ message: 'Access denied' });
      }

      bookings = await Booking.find(query)
        .populate('userId', 'name email')
        .populate('workerId', 'name profession')
        .sort({ createdAt: -1 });
    }

    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new booking (user only)
router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only users can create bookings' });
    }

    const { workerId, startTime, urgent, amount, advanceAmount, description, location } = req.body;

    // Validate worker exists and is verified
    const worker = await User.findById(workerId);
    if (!worker || worker.role !== 'worker' || !worker.verified) {
      return res.status(400).json({ message: 'Invalid worker' });
    }

    const booking = new Booking({
      userId: req.user._id,
      workerId,
      workerName: worker.name,
      profession: worker.profession,
      startTime: new Date(startTime),
      urgent: urgent || false,
      amount,
      advanceAmount: advanceAmount || 0,
      advancePaid: advanceAmount > 0,
      description,
      location
    });

    await booking.save();

    // Create notification for worker
    const Notification = require('../models/Notification');
    await new Notification({
      recipientId: workerId,
      senderId: req.user._id,
      message: `New booking request from ${req.user.name}`,
      type: 'booking'
    }).save();

    res.status(201).json(booking);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Worker accept booking
router.put('/:id/accept', async (req, res) => {
  try {
    if (req.user.role !== 'worker') {
      return res.status(403).json({ message: 'Only workers can accept bookings' });
    }

    const { arrivalMessage } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept this booking' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Booking cannot be accepted' });
    }

    booking.status = 'accepted';
    if (arrivalMessage) booking.arrivalMessage = arrivalMessage;
    await booking.save();

    // Create notification for user
    const Notification = require('../models/Notification');
    await new Notification({
      recipientId: booking.userId,
      senderId: req.user._id,
      message: `${req.user.name} has accepted your booking${arrivalMessage ? `. ${arrivalMessage}` : ''}`,
      type: 'booking'
    }).save();

    res.json(booking);
  } catch (error) {
    console.error('Accept booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Worker complete booking
router.put('/:id/complete', async (req, res) => {
  try {
    if (req.user.role !== 'worker') {
      return res.status(403).json({ message: 'Only workers can complete bookings' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to complete this booking' });
    }

    if (booking.status !== 'accepted') {
      return res.status(400).json({ message: 'Booking cannot be completed' });
    }

    booking.endTime = new Date();
    booking.status = 'completed';
    await booking.save();

    // Create notification for user
    const Notification = require('../models/Notification');
    await new Notification({
      recipientId: booking.userId,
      senderId: req.user._id,
      message: `${req.user.name} has completed the work. Please submit final price.`,
      type: 'booking'
    }).save();

    res.json(booking);
  } catch (error) {
    console.error('Complete booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Worker submit final price
router.put('/:id/submit-final-price', async (req, res) => {
  try {
    if (req.user.role !== 'worker') {
      return res.status(403).json({ message: 'Only workers can submit final price' });
    }

    const { finalAmount } = req.body;
    if (!finalAmount || finalAmount <= 0) {
      return res.status(400).json({ message: 'Valid final amount is required' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to submit final price for this booking' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Booking must be completed before submitting final price' });
    }

    booking.finalAmount = finalAmount;
    booking.remainingAmount = finalAmount - (booking.advanceAmount || 0);
    booking.status = 'final_price_submitted';
    await booking.save();

    // Create notification for user
    const Notification = require('../models/Notification');
    await new Notification({
      recipientId: booking.userId,
      senderId: req.user._id,
      message: `${req.user.name} has submitted the final price: $${finalAmount}. Remaining amount to pay: $${booking.remainingAmount}`,
      type: 'booking'
    }).save();

    res.json(booking);
  } catch (error) {
    console.error('Submit final price error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// User pay remaining amount
router.put('/:id/pay-remaining', async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only users can pay remaining amount' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to pay for this booking' });
    }

    if (booking.status !== 'final_price_submitted') {
      return res.status(400).json({ message: 'Booking must have final price submitted before payment' });
    }

    booking.finalPaid = true;
    booking.status = 'final_payment_done';
    await booking.save();

    res.json({ message: 'Payment Successful', booking });
  } catch (error) {
    console.error('Pay remaining error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// User rate and feedback
router.put('/:id/rate', async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only users can rate bookings' });
    }

    const { rating, feedback } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Valid rating (1-5) is required' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to rate this booking' });
    }

    if (booking.status !== 'final_payment_done') {
      return res.status(400).json({ message: 'Booking must be fully paid before rating' });
    }

    booking.rating = rating;
    booking.feedback = feedback || '';
    booking.status = 'rated';
    await booking.save();

    // Update worker's cumulative rating
    const worker = await User.findById(booking.workerId);
    if (worker) {
      const allBookings = await Booking.find({ workerId: booking.workerId, status: 'rated' });
      const totalRating = allBookings.reduce((sum, b) => sum + b.rating, 0);
      worker.rating = totalRating / allBookings.length;
      worker.totalJobs = allBookings.length;
      await worker.save();
    }

    res.json(booking);
  } catch (error) {
    console.error('Rate booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
