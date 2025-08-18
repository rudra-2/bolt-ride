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
  station_area: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  extra_capacity: {
    type: Number,
    default: 0
  },
  charging_ports: {
    type: Number,
    required: true
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
  timestamps: true
});

module.exports = mongoose.model('ParkingStation', parkingStationSchema);
