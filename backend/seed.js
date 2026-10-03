require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const bcrypt = require('bcryptjs');
const { pool, connectDB, newId } = require('./db');

const users = [
  { name: 'John Doe', email: 'john@example.com', password: 'password123', role: 'user', phone: '+1234567890', address: '123 Main St, City, State 12345' },
  { name: 'Jane Smith', email: 'jane@example.com', password: 'password123', role: 'user', phone: '+1987654321', address: '456 Oak Ave, Town, State 67890' },
  { name: 'Karthik', email: 'karthik@example.com', password: 'password123', role: 'user', phone: '+919876543210', address: '12 Anna Salai, Chennai, Tamil Nadu' },
  { name: 'Priya', email: 'priya@example.com', password: 'password123', role: 'user', phone: '+919876543211', address: '45 T Nagar, Chennai, Tamil Nadu' },
  { name: 'Surya', email: 'surya@example.com', password: 'password123', role: 'user', phone: '+919876543212', address: '76 OMR, Chennai, Tamil Nadu' },
  { name: 'Mike Johnson', email: 'mike@plumber.com', password: 'password123', role: 'worker', profession: 'Plumber', hourlyRate: 25, skills: ['Plumbing', 'Pipe Repair', 'Installation'], experience: '5 years', phone: '+1112223333', address: '789 Pine Rd, City, State 12345', verified: true, availability: true, rating: 4.8 },
  { name: 'Sarah Wilson', email: 'sarah@electrician.com', password: 'password123', role: 'worker', profession: 'Electrician', hourlyRate: 30, skills: ['Wiring', 'Electrical Repair', 'Lighting'], experience: '7 years', phone: '+1445556666', address: '101 Elm St, Town, State 67890', verified: true, availability: true, rating: 4.5 },
  { name: 'David Brown', email: 'david@pending.com', password: 'password123', role: 'worker', profession: 'Carpenter', hourlyRate: 20, skills: ['Woodwork', 'Furniture Repair'], experience: '3 years', phone: '+1778889999', address: '202 Maple Dr, Village, State 11223', verified: false, availability: true, rating: 0 },
  { name: 'Muthu', email: 'muthu@plumber.com', password: 'password123', role: 'worker', profession: 'Plumber', hourlyRate: 15, skills: ['Plumbing', 'Pipe Repair'], experience: '10 years', phone: '+919876543213', address: '12 Mount Road, Chennai, Tamil Nadu', verified: true, availability: true, rating: 4.9 },
  { name: 'Kavitha', email: 'kavitha@electrician.com', password: 'password123', role: 'worker', profession: 'Electrician', hourlyRate: 20, skills: ['Wiring', 'Electrical Repair'], experience: '6 years', phone: '+919876543214', address: '54 Velachery, Chennai, Tamil Nadu', verified: true, availability: true, rating: 4.6 },
  { name: 'Ramesh', email: 'ramesh@carpenter.com', password: 'password123', role: 'worker', profession: 'Carpenter', hourlyRate: 18, skills: ['Woodwork', 'Furniture Repair'], experience: '8 years', phone: '+919876543215', address: '89 Guindy, Chennai, Tamil Nadu', verified: false, availability: true, rating: 0 }
];

async function seedData() {
  try {
    await connectDB();
    const adminPassword = await bcrypt.hash('admin123', 10);
    await pool.execute(
      'INSERT IGNORE INTO admins (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [newId(), 'Admin User', 'admin@workerbook.com', adminPassword, 'admin']
    );

    for (const user of users) {
      const password = await bcrypt.hash(user.password, 10);
      await pool.execute(
        `INSERT IGNORE INTO users
          (id, name, email, password, role, phone, address, profession, hourlyRate, skills, experience, verified, availability, rating)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId(), user.name, user.email, password, user.role, user.phone || null, user.address || null,
          user.profession || null, user.hourlyRate || null, JSON.stringify(user.skills || []),
          user.experience || null, user.verified ?? (user.role === 'user'),
          user.availability ?? (user.role === 'user'), user.rating || 0
        ]
      );
    }
    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Seeding error:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seedData();
