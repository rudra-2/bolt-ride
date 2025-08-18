const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicle_id: {
    type: String,
    unique: true,
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
  qr_code: {
    type: String,
    unique: true,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
