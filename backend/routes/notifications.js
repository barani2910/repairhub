const express = require('express');
const { protect } = require('../middleware/auth');
const { pool, newId, toApi } = require('../db');

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT n.*, u.name AS senderName
       FROM notifications n
       LEFT JOIN users u ON u.id = n.senderId
       WHERE n.recipientId = ?
       ORDER BY n.createdAt DESC`,
      [req.user._id]
    );
    return res.json(rows.map((row) => {
      const notification = toApi(row);
      const { senderName } = notification;
      delete notification.senderName;
      notification.senderId = senderName ? { _id: notification.senderId, name: senderName } : null;
      return notification;
    }));
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { recipientId, message, type } = req.body;
    if (!recipientId || !message) {
      return res.status(400).json({ message: 'Recipient and message required' });
    }
    const id = newId();
    const senderId = req.user._id;
    await pool.execute(
      'INSERT INTO notifications (id, recipientId, senderId, message, type) VALUES (?, ?, ?, ?, ?)',
      [id, recipientId, senderId, message, type || 'system']
    );
    const [rows] = await pool.execute('SELECT * FROM notifications WHERE id = ?', [id]);
    return res.status(201).json(toApi(rows[0]));
  } catch (error) {
    console.error('Create notification error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const [result] = await pool.execute(
      'UPDATE notifications SET `read` = TRUE WHERE id = ? AND recipientId = ?',
      [req.params.id, req.user._id]
    );
    if (!result.affectedRows) {
      const [rows] = await pool.execute('SELECT recipientId FROM notifications WHERE id = ?', [req.params.id]);
      if (!rows[0]) return res.status(404).json({ message: 'Notification not found' });
      return res.status(403).json({ message: 'Not authorized' });
    }
    const [rows] = await pool.execute('SELECT * FROM notifications WHERE id = ?', [req.params.id]);
    return res.json(toApi(rows[0]));
  } catch (error) {
    console.error('Mark read error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM notifications WHERE id = ? AND recipientId = ?',
      [req.params.id, req.user._id]
    );
    if (!result.affectedRows) {
      const [rows] = await pool.execute('SELECT recipientId FROM notifications WHERE id = ?', [req.params.id]);
      if (!rows[0]) return res.status(404).json({ message: 'Notification not found' });
      return res.status(403).json({ message: 'Not authorized' });
    }
    return res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
