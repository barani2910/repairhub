require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const authRoutes = require('./routes/auth');
const bookingsRoutes = require('./routes/bookings');
const notificationsRoutes = require('./routes/notifications');
const leaveRequestsRoutes = require('./routes/leaveRequests');
const workersRoutes = require('./routes/workers');

const app = express();

// Connect to DB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', require('./routes/admin'));
app.use('/api/bookings', bookingsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/leave-requests', leaveRequestsRoutes);
app.use('/api/workers', workersRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('WorkerBook Backend API');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
