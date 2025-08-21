const mongoose = require('mongoose');

const rideHistorySchema = new mongoose.Schema({
  ride_id: {
    type: String,
    unique: true,
    required: true
  },
  user_id: { // Match admin-app field name
    type: Number,
    required: true
  },
  customer_id: { // Keep for compatibility
    type: Number,
    required: true
  },
  user_name: {
    type: String,
    required: true
  },
  vehicle_id: {
    type: String,
    required: true
  },
  vehicle_number: {
    type: String,
    required: true
  },
  station_id: {
    type: Number,
    required: true
  },
  start_time: {
    type: Date,
    required: true
  },
  end_time: {
    type: Date,
    default: null
  },
  duration_minutes: {
    type: Number,
    default: 0
  },
  distance_km: {
    type: Number,
    default: 0
  },
  fare: {
    type: Number,
    default: 0
  },
  amount: { 
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  payment_status: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  drop_station_id: {
    type: Number,
    default: null
  }
}, {
  timestamps: true,
  collection: 'rides' // Match admin-app collection name
});

module.exports = mongoose.model('RideHistory', rideHistorySchema);
