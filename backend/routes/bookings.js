const express = require('express');
const { protect } = require('../middleware/auth');
const { pool, newId, toApi } = require('../db');

const router = express.Router();

router.use(protect);

async function findBooking(id) {
  const [rows] = await pool.execute('SELECT * FROM bookings WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function updateBooking(id, changes) {
  const columns = Object.keys(changes);
  await pool.execute(
    `UPDATE bookings SET ${columns.map((column) => `\`${column}\` = ?`).join(', ')} WHERE id = ?`,
    [...columns.map((column) => changes[column]), id]
  );
  return findBooking(id);
}

async function notify(recipientId, senderId, message) {
  await pool.execute(
    'INSERT INTO notifications (id, recipientId, senderId, message, type) VALUES (?, ?, ?, ?, ?)',
    [newId(), recipientId, senderId, message, 'booking']
  );
}

router.get('/', async (req, res) => {
  try {
    const { role, _id: userId } = req.user;
    let filter = '';
    const values = [];
    if (role === 'user') {
      filter = 'WHERE b.userId = ?';
      values.push(userId);
    } else if (role === 'worker') {
      filter = 'WHERE b.workerId = ?';
      values.push(userId);
    } else if (role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const [rows] = await pool.execute(
      `SELECT b.*, u.name AS joinedUserName, u.email AS joinedUserEmail,
        w.name AS joinedWorkerName, w.profession AS joinedWorkerProfession
       FROM bookings b
       LEFT JOIN users u ON u.id = b.userId
       LEFT JOIN users w ON w.id = b.workerId
       ${filter}
       ORDER BY b.createdAt DESC`,
      values
    );
    return res.json(rows.map((row) => {
      const booking = toApi(row);
      const { joinedUserName, joinedUserEmail, joinedWorkerName, joinedWorkerProfession } = booking;
      delete booking.joinedUserName;
      delete booking.joinedUserEmail;
      delete booking.joinedWorkerName;
      delete booking.joinedWorkerProfession;
      booking.userId = joinedUserName ? { _id: booking.userId, name: joinedUserName, email: joinedUserEmail } : null;
      booking.workerId = joinedWorkerName
        ? { _id: booking.workerId, name: joinedWorkerName, profession: joinedWorkerProfession }
        : null;
      return booking;
    }));
  } catch (error) {
    console.error('Get bookings error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only users can create bookings' });
    }
    const { workerId, startTime, urgent, amount, advanceAmount, description, location } = req.body;
    const [workers] = await pool.execute(
      'SELECT name, profession, role, verified FROM users WHERE id = ? LIMIT 1',
      [workerId]
    );
    const worker = workers[0];
    if (!worker || worker.role !== 'worker' || !worker.verified) {
      return res.status(400).json({ message: 'Invalid worker' });
    }

    const id = newId();
    const advance = Number(advanceAmount) || 0;
    await pool.execute(
      `INSERT INTO bookings
        (id, userId, workerId, workerName, profession, startTime, urgent, amount, advanceAmount, advancePaid, description, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, req.user._id, workerId, worker.name, worker.profession, new Date(startTime),
        Boolean(urgent), amount, advance, advance > 0, description, location
      ]
    );
    await notify(workerId, req.user._id, `New booking request from ${req.user.name}`);
    return res.status(201).json(toApi(await findBooking(id)));
  } catch (error) {
    console.error('Create booking error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/accept', async (req, res) => {
  try {
    if (req.user.role !== 'worker') {
      return res.status(403).json({ message: 'Only workers can accept bookings' });
    }
    const { arrivalMessage } = req.body;
    const booking = await findBooking(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.workerId !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized to accept this booking' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Booking cannot be accepted' });
    }
    const updated = await updateBooking(req.params.id, {
      status: 'accepted',
      arrivalMessage: arrivalMessage || booking.arrivalMessage
    });
    await notify(
      booking.userId,
      req.user._id,
      `${req.user.name} has accepted your booking${arrivalMessage ? `. ${arrivalMessage}` : ''}`
    );
    return res.json(toApi(updated));
  } catch (error) {
    console.error('Accept booking error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/complete', async (req, res) => {
  try {
    if (req.user.role !== 'worker') {
      return res.status(403).json({ message: 'Only workers can complete bookings' });
    }
    const booking = await findBooking(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.workerId !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized to complete this booking' });
    }
    if (booking.status !== 'accepted') {
      return res.status(400).json({ message: 'Booking cannot be completed' });
    }
    const updated = await updateBooking(req.params.id, { endTime: new Date(), status: 'completed' });
    await notify(booking.userId, req.user._id, `${req.user.name} has completed the work. Please submit final price.`);
    return res.json(toApi(updated));
  } catch (error) {
    console.error('Complete booking error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/submit-final-price', async (req, res) => {
  try {
    if (req.user.role !== 'worker') {
      return res.status(403).json({ message: 'Only workers can submit final price' });
    }
    const { finalAmount } = req.body;
    if (!finalAmount || finalAmount <= 0) {
      return res.status(400).json({ message: 'Valid final amount is required' });
    }
    const booking = await findBooking(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.workerId !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized to submit final price for this booking' });
    }
    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Booking must be completed before submitting final price' });
    }
    const remainingAmount = Number(finalAmount) - Number(booking.advanceAmount || 0);
    const updated = await updateBooking(req.params.id, {
      finalAmount,
      remainingAmount,
      status: 'final_price_submitted'
    });
    await notify(
      booking.userId,
      req.user._id,
      `${req.user.name} has submitted the final price: $${finalAmount}. Remaining amount to pay: $${remainingAmount}`
    );
    return res.json(toApi(updated));
  } catch (error) {
    console.error('Submit final price error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/pay-remaining', async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only users can pay remaining amount' });
    }
    const booking = await findBooking(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized to pay for this booking' });
    }
    if (booking.status !== 'final_price_submitted') {
      return res.status(400).json({ message: 'Booking must have final price submitted before payment' });
    }
    const updated = await updateBooking(req.params.id, { finalPaid: true, status: 'final_payment_done' });
    return res.json({ message: 'Payment Successful', booking: toApi(updated) });
  } catch (error) {
    console.error('Pay remaining error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/rate', async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only users can rate bookings' });
    }
    const { rating, feedback } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Valid rating (1-5) is required' });
    }
    const booking = await findBooking(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized to rate this booking' });
    }
    if (booking.status !== 'final_payment_done') {
      return res.status(400).json({ message: 'Booking must be fully paid before rating' });
    }
    const updated = await updateBooking(req.params.id, {
      rating,
      feedback: feedback || '',
      status: 'rated'
    });

    const [ratingRows] = await pool.execute(
      'SELECT AVG(rating) AS rating, COUNT(*) AS totalJobs FROM bookings WHERE workerId = ? AND status = ?',
      [booking.workerId, 'rated']
    );
    await pool.execute(
      'UPDATE users SET rating = ?, totalJobs = ? WHERE id = ?',
      [ratingRows[0].rating || 0, ratingRows[0].totalJobs, booking.workerId]
    );
    return res.json(toApi(updated));
  } catch (error) {
    console.error('Rate booking error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
