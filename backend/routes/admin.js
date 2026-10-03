const express = require('express');
const { protect, isAdmin } = require('../middleware/auth');
const { pool, toApi } = require('../db');

const router = express.Router();

router.use(protect, isAdmin);

router.post('/approve-worker/:id', async (req, res) => {
  const { id } = req.params;
  if (!id || id === 'undefined') {
    return res.status(400).json({ message: 'Invalid worker ID' });
  }
  try {
    const [rows] = await pool.execute(
      'SELECT role, verified FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    if (!rows[0] || rows[0].role !== 'worker') {
      return res.status(404).json({ message: 'Worker not found' });
    }
    if (rows[0].verified) {
      return res.status(400).json({ message: 'Worker already verified' });
    }
    await pool.execute('UPDATE users SET verified = TRUE, availability = TRUE WHERE id = ?', [id]);
    return res.json({ message: 'Worker approved successfully' });
  } catch (error) {
    console.error('Approve worker error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

const listUsers = async (res, sql, values) => {
  const [rows] = await pool.execute(sql, values);
  return res.json(rows.map((row) => {
    const user = toApi(row);
    delete user.password;
    return user;
  }));
};

router.get('/pending-workers', async (req, res) => {
  try {
    return await listUsers(res, 'SELECT * FROM users WHERE role = ? AND verified = FALSE', ['worker']);
  } catch (error) {
    console.error('Get pending workers error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/workers', async (req, res) => {
  try {
    return await listUsers(res, 'SELECT * FROM users WHERE role = ?', ['worker']);
  } catch (error) {
    console.error('Get workers error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/users', async (req, res) => {
  try {
    return await listUsers(res, 'SELECT * FROM users WHERE role = ?', ['user']);
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/admins', async (req, res) => {
  try {
    return await listUsers(res, 'SELECT * FROM admins', []);
  } catch (error) {
    console.error('Get admins error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/reject-worker/:id', async (req, res) => {
  const { id } = req.params;
  if (!id || id === 'undefined') {
    return res.status(400).json({ message: 'Invalid worker ID' });
  }
  try {
    const [result] = await pool.execute(
      'DELETE FROM users WHERE id = ? AND role = ?',
      [id, 'worker']
    );
    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    return res.json({ message: 'Worker rejected and removed' });
  } catch (error) {
    console.error('Reject worker error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/bookings', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT b.*, u.name AS joinedUserName, u.email AS joinedUserEmail,
        w.name AS joinedWorkerName, w.profession AS joinedWorkerProfession
       FROM bookings b
       LEFT JOIN users u ON u.id = b.userId
       LEFT JOIN users w ON w.id = b.workerId
       ORDER BY b.createdAt DESC`
    );
    return res.json(rows.map((row) => {
      const booking = toApi(row);
      const { joinedUserName, joinedUserEmail, joinedWorkerName, joinedWorkerProfession } = booking;
      delete booking.joinedUserName;
      delete booking.joinedUserEmail;
      delete booking.joinedWorkerName;
      delete booking.joinedWorkerProfession;
      booking.userId = joinedUserName ? { _id: booking.userId, name: joinedUserName, email: joinedUserEmail } : null;
      booking.workerId = joinedWorkerName ? { _id: booking.workerId, name: joinedWorkerName, profession: joinedWorkerProfession } : null;
      return booking;
    }));
  } catch (error) {
    console.error('Get all bookings error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/leave-requests', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT l.*, u.name AS joinedWorkerName, u.email AS joinedWorkerEmail
       FROM leaveRequests l
       LEFT JOIN users u ON u.id = l.workerId
       ORDER BY l.appliedAt DESC`
    );
    return res.json(rows.map((row) => {
      const leaveRequest = toApi(row);
      const { joinedWorkerName, joinedWorkerEmail } = leaveRequest;
      delete leaveRequest.joinedWorkerName;
      delete leaveRequest.joinedWorkerEmail;
      leaveRequest.workerId = joinedWorkerName
        ? { _id: leaveRequest.workerId, name: joinedWorkerName, email: joinedWorkerEmail }
        : null;
      return leaveRequest;
    }));
  } catch (error) {
    console.error('Get all leave requests error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
