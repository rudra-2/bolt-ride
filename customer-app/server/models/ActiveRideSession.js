const mongoose = require('mongoose');

const activeRideSessionSchema = new mongoose.Schema({
  customer_id: {
    type: Number,
    required: true,
    unique: true
  },
  ride_id: {
    type: String,
    required: true
  },
  vehicle_id: {
    type: String,
    required: true
  },
  session_start_time: {
    type: Date,
    required: true
  },
  last_ping_time: {
    type: Date,
    default: Date.now
  },
  start_location: {
    latitude: Number,
    longitude: Number
  },
  current_location: {
    latitude: Number,
    longitude: Number
  },
  total_distance: {
    type: Number,
    default: 0
  },
  session_active: {
    type: Boolean,
    default: true
  },
  browser_session_id: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Auto-expire sessions after 4 hours of inactivity
activeRideSessionSchema.index({ last_ping_time: 1 }, { expireAfterSeconds: 14400 });

module.exports = mongoose.model('ActiveRideSession', activeRideSessionSchema);
