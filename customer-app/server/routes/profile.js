const express = require('express');
const bcrypt = require('bcryptjs');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');
const router = express.Router();

// Get profile
router.get('/', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id).select('-password');
    
    res.json({
      message: 'Profile fetched successfully',
      customer
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update profile
router.put('/', auth, async (req, res) => {
  try {
    const { customer_name, email, mobile, license_number } = req.body;
    const customer_id = req.customer.customer_id;

    // Check if email or mobile already exists for other customers
    const existingCustomer = await Customer.findOne({
      $or: [{ email }, { mobile }],
      customer_id: { $ne: customer_id }
    });

    if (existingCustomer) {
      return res.status(400).json({ message: 'Email or mobile already exists' });
    }

    // Update customer
    const customer = await Customer.findOneAndUpdate(
      { customer_id },
      {
        customer_name,
        email,
        mobile,
        license_number
      },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      customer
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change password
router.put('/password', auth, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const customer_id = req.customer.customer_id;

    // Get customer with password
    const customer = await Customer.findOne({ customer_id });

    // Check current password
    const isMatch = await bcrypt.compare(current_password, customer.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    // Update password
    await Customer.findOneAndUpdate(
      { customer_id },
      { password: hashedPassword }
    );

    res.json({
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
