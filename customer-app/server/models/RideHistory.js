const mongoose = require('mongoose');

const rideHistorySchema = new mongoose.Schema({
  ride_id: {
    type: String,
    unique: true,
    required: true
  },
  customer_id: {
    type: Number,
    required: true
  },
  vehicle_id: {
    type: String,
    required: true
  },
  pickup_station_id: {
    type: Number,
    required: true
  },
  drop_station_id: {
    type: Number,
    default: null
  },
  distance: {
    type: Number,
    default: 0
  },
  total_time: {
    type: Number,
    default: 0
  },
  start_date: {
    type: Date,
    default: Date.now
  },
  end_date: {
    type: Date,
    default: null
  },
  fare_collected: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['ongoing', 'completed', 'cancelled'],
    default: 'ongoing'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RideHistory', rideHistorySchema);
