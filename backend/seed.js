require('dotenv').config({ path: './backend/.env' });
const bcrypt = require('bcryptjs');
const connectDB = require('./db');
const User = require('./models/User');
const Admin = require('./models/Admin');

const seedData = async () => {
  await connectDB();
  try {
    // Seed Admin
    const adminEmail = 'admin@workerbook.com';
    const adminPassword = 'admin123';
    const adminHashedPassword = await bcrypt.hash(adminPassword, 10);

    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const admin = new Admin({
        name: 'Admin User',
        email: adminEmail,
        password: adminHashedPassword
      });
      await admin.save();
      console.log('Admin seeded successfully');
    } else {
      console.log('Admin already exists');
    }

    // Seed Regular Users
    const userTemplates = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'user',
        phone: '+1234567890',
        address: '123 Main St, City, State 12345'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
        role: 'user',
        phone: '+1987654321',
        address: '456 Oak Ave, Town, State 67890'
      }
    ];

    for (const template of userTemplates) {
      const hashedPassword = await bcrypt.hash(template.password, 10);
      const userData = { ...template, password: hashedPassword };
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`User ${userData.name} seeded successfully`);
      } else {
        console.log(`User ${userData.name} already exists`);
      }
    }

    // Seed Workers (verified and pending)
    const workerTemplates = [
      {
        name: 'Mike Johnson',
        email: 'mike@plumber.com',
        password: 'password123',
        role: 'worker',
        profession: 'Plumber',
        hourlyRate: 25,
        skills: ['Plumbing', 'Pipe Repair', 'Installation'],
        experience: '5 years',
        phone: '+1112223333',
        address: '789 Pine Rd, City, State 12345',
        verified: true,
        availability: true,
        rating: 4.8
      },
      {
        name: 'Sarah Wilson',
        email: 'sarah@electrician.com',
        password: 'password123',
        role: 'worker',
        profession: 'Electrician',
        hourlyRate: 30,
        skills: ['Wiring', 'Electrical Repair', 'Lighting'],
        experience: '7 years',
        phone: '+1445556666',
        address: '101 Elm St, Town, State 67890',
        verified: true,
        availability: true,
        rating: 4.5
      },
      {
        name: 'David Brown',
        email: 'david@pending.com',
        password: 'password123',
        role: 'worker',
        profession: 'Carpenter',
        hourlyRate: 20,
        skills: ['Woodwork', 'Furniture Repair'],
        experience: '3 years',
        phone: '+1778889999',
        address: '202 Maple Dr, Village, State 11223',
        verified: false,
        availability: true,
        rating: 0
      }
    ];

    for (const template of workerTemplates) {
      const hashedPassword = await bcrypt.hash(template.password, 10);
      const workerData = { ...template, password: hashedPassword };
      const existingWorker = await User.findOne({ email: workerData.email });
      if (!existingWorker) {
        const worker = new User(workerData);
        await worker.save();
        console.log(`Worker ${workerData.name} seeded successfully`);
      } else {
        console.log(`Worker ${workerData.name} already exists`);
      }
    }

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
