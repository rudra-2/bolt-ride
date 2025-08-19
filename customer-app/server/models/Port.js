const mongoose = require('mongoose');

const portSchema = new mongoose.Schema({
  port_id: {
    type: String,
    unique: true,
    required: true
  },
  station_id: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance', 'broken'],
    default: 'available'
  },
  current_vehicle_id: {
    type: String,
    default: null
  },
  connector_type: {
    type: String,
    default: 'Type2'
  },
  max_power_kw: {
    type: Number,
    default: 22
  },
  usage_count: {
    type: Number,
    default: 0
  },
  last_service: {
    type: Date,
    default: Date.now
  },
  occupied_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'charging_ports' // Match admin-app collection name
});

module.exports = mongoose.model('Port', portSchema);
