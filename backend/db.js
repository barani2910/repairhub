const mysql = require('mysql2/promise');
const { randomBytes } = require('crypto');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'repairhub',
  waitForConnections: true,
  connectionLimit: 10,
  timezone: 'Z',
  decimalNumbers: true
});

const schema = [
  `CREATE TABLE IF NOT EXISTS users (
    id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'worker') NOT NULL,
    phone VARCHAR(100),
    address TEXT,
    avatar TEXT,
    profession VARCHAR(255),
    location VARCHAR(255),
    hourlyRate DECIMAL(10, 2),
    rating DECIMAL(4, 2) NOT NULL DEFAULT 0,
    totalJobs INT NOT NULL DEFAULT 0,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    skills JSON NOT NULL,
    experience VARCHAR(255),
    availability BOOLEAN NOT NULL DEFAULT TRUE,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS admins (
    id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS bookings (
    id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    userId CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    workerId CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    workerName VARCHAR(255) NOT NULL,
    profession VARCHAR(255) NOT NULL,
    startTime DATETIME(3) NOT NULL,
    endTime DATETIME(3),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    urgent BOOLEAN NOT NULL DEFAULT FALSE,
    amount DECIMAL(10, 2) NOT NULL,
    paymentStatus VARCHAR(50) NOT NULL DEFAULT 'pending',
    advanceAmount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    finalAmount DECIMAL(10, 2),
    remainingAmount DECIMAL(10, 2),
    advancePaid BOOLEAN NOT NULL DEFAULT FALSE,
    finalPaid BOOLEAN NOT NULL DEFAULT FALSE,
    rating DECIMAL(3, 1),
    feedback TEXT,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    arrivalMessage TEXT,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX bookings_userId_idx (userId),
    INDEX bookings_workerId_idx (workerId),
    INDEX bookings_createdAt_idx (createdAt)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS leaveRequests (
    id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    workerId CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    startDate DATETIME(3) NOT NULL,
    endDate DATETIME(3) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    appliedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX leaveRequests_workerId_idx (workerId),
    INDEX leaveRequests_appliedAt_idx (appliedAt)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id CHAR(24) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    recipientId CHAR(24) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    senderId CHAR(24) CHARACTER SET ascii COLLATE ascii_bin,
    message TEXT NOT NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    \`read\` BOOLEAN NOT NULL DEFAULT FALSE,
    type VARCHAR(50) NOT NULL DEFAULT 'system',
    INDEX notifications_recipientId_createdAt_idx (recipientId, createdAt)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
];

async function connectDB() {
  if (!process.env.MYSQL_USER || !process.env.MYSQL_DATABASE) {
    throw new Error(
      'MYSQL_USER and MYSQL_DATABASE must be set in backend/.env. Create that MySQL database before starting the API.'
    );
  }
  const connection = await pool.getConnection();
  try {
    for (const statement of schema) {
      await connection.query(statement);
    }
    console.log(`MySQL connected: ${process.env.MYSQL_HOST || 'localhost'}/${process.env.MYSQL_DATABASE || 'repairhub'}`);
  } finally {
    connection.release();
  }
}

function newId() {
  return randomBytes(12).toString('hex');
}

function toApi(row) {
  if (!row) return null;
  const { id, ...fields } = row;
  const result = { _id: id, ...fields };
  for (const key of ['verified', 'availability', 'urgent', 'advancePaid', 'finalPaid', 'read']) {
    if (key in result) result[key] = Boolean(result[key]);
  }
  if (typeof result.skills === 'string') result.skills = JSON.parse(result.skills);
  return result;
}

module.exports = { pool, connectDB, newId, toApi };
