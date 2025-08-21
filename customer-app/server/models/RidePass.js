const mongoose = require('mongoose');

const ridePassSchema = new mongoose.Schema({
  pass_id: {
    type: String,
    unique: true,
    required: true
  },
  customer_id: {
    type: Number,
    required: true
  },
  price_paid: {
    type: Number,
    required: true
  },
  start_date: {
    type: Date,
    default: Date.now
  },
  end_date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  }
}, {
  timestamps: true,
  collection: 'ride_passes' // Keep separate as it's new functionality
});

module.exports = mongoose.model('RidePass', ridePassSchema);
