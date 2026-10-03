const jwt = require('jsonwebtoken');
const { pool, toApi } = require('../db');

const protect = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(authorization.split(' ')[1], process.env.JWT_SECRET);
    const table = decoded.role === 'admin' ? 'admins' : 'users';
    const [rows] = await pool.execute(`SELECT * FROM ${table} WHERE id = ? LIMIT 1`, [decoded.id]);
    if (!rows[0]) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    const { password, ...user } = toApi(rows[0]);
    req.user = user;
    return next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Admin access required' });
};

module.exports = { protect, isAdmin };
