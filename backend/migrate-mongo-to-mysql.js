require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { MongoClient } = require('mongodb');
const { pool, connectDB } = require('./db');

const date = (value, fallback = new Date()) => value ? new Date(value) : fallback;
const id = (document) => document._id.toString();
const bool = (value) => Boolean(value);

async function insertDocuments(connection, table, columns, documents, valuesFor) {
  const placeholders = columns.map(() => '?').join(', ');
  const sql = `INSERT INTO \`${table}\` (${columns.map((column) => `\`${column}\``).join(', ')}) VALUES (${placeholders})`;
  for (const document of documents) {
    await connection.execute(sql, valuesFor(document));
  }
}

async function migrate() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI must be set to the source MongoDB connection string');
  }

  const mongo = new MongoClient(mongoUri);
  try {
    await connectDB();
    await mongo.connect();
    const source = mongo.db(process.env.MONGODB_DATABASE || undefined);
    const [users, admins, bookings, leaveRequests, notifications] = await Promise.all([
      source.collection('users').find({}).toArray(),
      source.collection('admins').find({}).toArray(),
      source.collection('bookings').find({}).toArray(),
      source.collection('leaverequests').find({}).toArray(),
      source.collection('notifications').find({}).toArray()
    ]);

    const counts = {};
    for (const table of ['users', 'admins', 'bookings', 'leaveRequests', 'notifications']) {
      const [rows] = await pool.query(`SELECT COUNT(*) AS count FROM \`${table}\``);
      counts[table] = rows[0].count;
    }
    if (Object.values(counts).some((count) => Number(count) > 0)) {
      throw new Error(`Migration stopped because destination tables are not empty: ${JSON.stringify(counts)}`);
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await insertDocuments(connection, 'users', [
        'id', 'name', 'email', 'password', 'role', 'phone', 'address', 'avatar', 'profession',
        'location', 'hourlyRate', 'rating', 'totalJobs', 'verified', 'skills', 'experience',
        'availability', 'createdAt', 'updatedAt'
      ], users, (user) => [
        id(user), user.name, user.email, user.password, user.role, user.phone || null, user.address || null,
        user.avatar || null, user.profession || null, user.location || null, user.hourlyRate ?? null,
        user.rating ?? 0, user.totalJobs ?? 0, bool(user.verified), JSON.stringify(user.skills || []),
        user.experience || null, user.availability ?? true, date(user.createdAt), date(user.updatedAt)
      ]);
      await insertDocuments(connection, 'admins', [
        'id', 'name', 'email', 'password', 'role', 'createdAt', 'updatedAt'
      ], admins, (admin) => [
        id(admin), admin.name, admin.email, admin.password, admin.role || 'admin',
        date(admin.createdAt), date(admin.updatedAt)
      ]);
      await insertDocuments(connection, 'bookings', [
        'id', 'userId', 'workerId', 'workerName', 'profession', 'startTime', 'endTime', 'status',
        'urgent', 'amount', 'paymentStatus', 'advanceAmount', 'finalAmount', 'remainingAmount',
        'advancePaid', 'finalPaid', 'rating', 'feedback', 'description', 'location', 'arrivalMessage',
        'createdAt', 'updatedAt'
      ], bookings, (booking) => [
        id(booking), booking.userId.toString(), booking.workerId.toString(), booking.workerName,
        booking.profession, date(booking.startTime), booking.endTime ? date(booking.endTime) : null,
        booking.status || 'pending', bool(booking.urgent), booking.amount, booking.paymentStatus || 'pending',
        booking.advanceAmount ?? 0, booking.finalAmount ?? null, booking.remainingAmount ?? null,
        bool(booking.advancePaid), bool(booking.finalPaid), booking.rating ?? null, booking.feedback || null,
        booking.description, booking.location, booking.arrivalMessage || null,
        date(booking.createdAt), date(booking.updatedAt)
      ]);
      await insertDocuments(connection, 'leaveRequests', [
        'id', 'workerId', 'startDate', 'endDate', 'reason', 'status', 'appliedAt'
      ], leaveRequests, (request) => [
        id(request), request.workerId.toString(), date(request.startDate), date(request.endDate),
        request.reason, request.status || 'pending', date(request.appliedAt)
      ]);
      await insertDocuments(connection, 'notifications', [
        'id', 'recipientId', 'senderId', 'message', 'createdAt', 'read', 'type'
      ], notifications, (notification) => [
        id(notification), notification.recipientId.toString(),
        notification.senderId ? notification.senderId.toString() : null, notification.message,
        date(notification.createdAt), bool(notification.read), notification.type || 'system'
      ]);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    console.log('MongoDB data copied to MySQL:', {
      users: users.length,
      admins: admins.length,
      bookings: bookings.length,
      leaveRequests: leaveRequests.length,
      notifications: notifications.length
    });
  } finally {
    await mongo.close();
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error('MongoDB to MySQL migration failed:', error);
  process.exitCode = 1;
});
