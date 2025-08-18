const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { customer_name, email, mobile, password, license_number } = req.body;

    // Check if customer exists
    const existingCustomer = await Customer.findOne({
      $or: [{ email }, { mobile }]
    });

    if (existingCustomer) {
      return res.status(400).json({ message: 'Customer already exists with this email or mobile' });
    }

    // Generate customer_id
    const lastCustomer = await Customer.findOne().sort({ customer_id: -1 });
    const customer_id = lastCustomer ? lastCustomer.customer_id + 1 : 1001;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create customer
    const customer = new Customer({
      customer_id,
      customer_name,
      email,
      mobile,
      password: hashedPassword,
      license_number,
      wallet: 100 // Starting bonus
    });

    await customer.save();

    // Generate JWT
    const token = jwt.sign(
      { id: customer._id, customer_id: customer.customer_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Customer registered successfully',
      token,
      customer: {
        customer_id: customer.customer_id,
        customer_name: customer.customer_name,
        email: customer.email,
        mobile: customer.mobile,
        wallet: customer.wallet
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find customer
    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: customer._id, customer_id: customer.customer_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      customer: {
        customer_id: customer.customer_id,
        customer_name: customer.customer_name,
        email: customer.email,
        mobile: customer.mobile,
        wallet: customer.wallet
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
