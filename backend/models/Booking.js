const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workerName: { type: String, required: true },
  profession: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  status: { type: String, enum: ['pending', 'accepted', 'completed', 'final_price_submitted', 'final_payment_done', 'rated'], default: 'pending' },
  urgent: { type: Boolean, default: false },
  amount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['paid', 'pending'], default: 'pending' },
  advanceAmount: { type: Number, default: 0 },
  finalAmount: { type: Number },
  remainingAmount: { type: Number },
  advancePaid: { type: Boolean, default: false },
  finalPaid: { type: Boolean, default: false },
  rating: { type: Number, min: 1, max: 5 },
  feedback: { type: String },
  description: { type: String, required: true },
  location: { type: String, required: true },
  arrivalMessage: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
