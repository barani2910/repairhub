const express = require('express');
const { protect, isAdmin } = require('../middleware/auth');
const { pool, newId, toApi } = require('../db');

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const [rows] = await pool.execute(
        `SELECT l.*, u.name AS workerName, u.email AS workerEmail
         FROM leaveRequests l
         LEFT JOIN users u ON u.id = l.workerId
         ORDER BY l.appliedAt DESC`
      );
      return res.json(rows.map((row) => {
        const leaveRequest = toApi(row);
        const { workerName, workerEmail } = leaveRequest;
        delete leaveRequest.workerName;
        delete leaveRequest.workerEmail;
        leaveRequest.workerId = workerName
          ? { _id: leaveRequest.workerId, name: workerName, email: workerEmail }
          : null;
        return leaveRequest;
      }));
    }
    if (req.user.role !== 'worker') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const [rows] = await pool.execute(
      'SELECT * FROM leaveRequests WHERE workerId = ? ORDER BY appliedAt DESC',
      [req.user._id]
    );
    return res.json(rows.map(toApi));
  } catch (error) {
    console.error('Get leave requests error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'worker') {
      return res.status(403).json({ message: 'Only workers can create leave requests' });
    }
    const { startDate, endDate, reason } = req.body;
    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'Start date, end date, and reason required' });
    }
    const id = newId();
    await pool.execute(
      'INSERT INTO leaveRequests (id, workerId, startDate, endDate, reason) VALUES (?, ?, ?, ?, ?)',
      [id, req.user._id, new Date(startDate), new Date(endDate), reason]
    );
    const [rows] = await pool.execute('SELECT * FROM leaveRequests WHERE id = ?', [id]);
    return res.status(201).json(toApi(rows[0]));
  } catch (error) {
    console.error('Create leave request error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

async function updateLeaveStatus(req, res, status) {
  try {
    const [rows] = await pool.execute('SELECT * FROM leaveRequests WHERE id = ? LIMIT 1', [req.params.id]);
    const leaveRequest = rows[0];
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }
    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({ message: `Leave request cannot be ${status}` });
    }

    await pool.execute(
      'UPDATE leaveRequests SET status = ? WHERE id = ? AND status = ?',
      [status, req.params.id, 'pending']
    );
    await pool.execute(
      'INSERT INTO notifications (id, recipientId, senderId, message, type) VALUES (?, ?, ?, ?, ?)',
      [
        newId(),
        leaveRequest.workerId,
        req.user._id,
        `Your leave request from ${new Date(leaveRequest.startDate).toDateString()} to ${new Date(leaveRequest.endDate).toDateString()} has been ${status}`,
        'leave'
      ]
    );
    leaveRequest.status = status;
    return res.json(toApi(leaveRequest));
  } catch (error) {
    console.error(`${status === 'approved' ? 'Approve' : 'Reject'} leave request error:`, error);
    return res.status(500).json({ message: 'Server error' });
  }
}

router.put('/admin/:id/approve', isAdmin, (req, res) => updateLeaveStatus(req, res, 'approved'));
router.put('/admin/:id/reject', isAdmin, (req, res) => updateLeaveStatus(req, res, 'rejected'));

module.exports = router;
