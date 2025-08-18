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
    enum: ['active', 'idle', 'broken'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Port', portSchema);
