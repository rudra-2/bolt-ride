const mongoose = require('mongoose');

const stationManagerSchema = new mongoose.Schema({
  manager_id: {
    type: String,
    unique: true,
    required: true
  },
  station_id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true // For authentication
  },
  role: {
    type: String,
    enum: ['station_manager', 'station_master', 'admin'],
    default: 'station_manager'
  },
  assigned_since: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  last_login: {
    type: Date,
    default: null
  },
  permissions: {
    manage_vehicles: {
      type: Boolean,
      default: true
    },
    manage_charging_ports: {
      type: Boolean,
      default: true
    },
    view_reports: {
      type: Boolean,
      default: true
    },
    manage_rides: {
      type: Boolean,
      default: true
    },
    manage_payments: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  collection: 'station_managers' // Match the existing collection
});

module.exports = mongoose.model('StationManager', stationManagerSchema);
