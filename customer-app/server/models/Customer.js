const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customer_id: {
    type: Number,
    unique: true,
    required: true
  },
  customer_name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  mobile: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  license_number: {
    type: String,
    required: true
  },
  wallet: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'customers' // Keep customers as it's not used in admin-app
});

module.exports = mongoose.model('Customer', customerSchema);
