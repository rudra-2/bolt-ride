const mongoose = require('mongoose');

const parkingStationSchema = new mongoose.Schema({
  station_id: {
    type: Number,
    unique: true,
    required: true
  },
  station_name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  vehicle_capacity: {
    type: Number,
    required: true,
    default: 50
  },
  extra_capacity: {
    type: Number,
    required: true,
    default: 5
  },
  charging_ports: {
    type: Number,
    required: true
  },
  password: {
    type: String,
    required: true // Admin authentication
  },
  coordinates: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  }
}, {
  timestamps: true,
  collection: 'stations' // Match admin-app collection name
});

module.exports = mongoose.model('ParkingStation', parkingStationSchema);
