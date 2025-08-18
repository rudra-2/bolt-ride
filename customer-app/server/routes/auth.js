const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const { validate, schemas } = require('../middleware/validation');
const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new customer
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_name
 *               - email
 *               - mobile
 *               - password
 *               - license_number
 *             properties:
 *               customer_name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password123"
 *               license_number:
 *                 type: string
 *                 example: "DL1234567890"
 *     responses:
 *       201:
 *         description: Customer registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 customer:
 *                   $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Validation error or customer already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Register
router.post('/register', validate(schemas.register), async (req, res) => {
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

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login customer
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 customer:
 *                   $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Login
router.post('/login', validate(schemas.login), async (req, res) => {
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
