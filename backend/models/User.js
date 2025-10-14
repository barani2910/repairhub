const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'worker'], required: true },
  phone: { type: String },
  address: { type: String }, // for users
  avatar: { type: String },
  // Worker specific fields
  profession: { type: String },
  location: { type: String },
  hourlyRate: { type: Number },
  rating: { type: Number, default: 0 },
  totalJobs: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  skills: [{ type: String }],
  experience: { type: String },
  availability: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
