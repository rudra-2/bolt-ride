const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicle_id: {
    type: String,
    unique: true,
    required: true
  },
  vehicle_number: {
    type: String,
    required: true
  },
  vehicle_name: {
    type: String,
    required: true
  },
  station_id: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  battery: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['available', 'in_use', 'maintenance', 'charging'],
    default: 'available'
  },
  odometer_reading: {
    type: Number,
    default: 0
  },
  rental_rate: {
    per_km: {
      type: Number,
      default: 0
    },
    per_hour: {
      type: Number,
      default: 0
    }
  },
  last_service: {
    type: Date,
    default: Date.now
  },
  qr_code: {
    type: String,
    unique: true,
    required: true
  },
  added_on: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'vehicle_details' // Use the actual collection name from database
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
