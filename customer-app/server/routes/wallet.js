const express = require('express');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');
const router = express.Router();

// Add money to wallet
router.post('/add', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const customer_id = req.customer.customer_id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    if (amount > 10000) {
      return res.status(400).json({ message: 'Maximum amount per transaction is ₹10,000' });
    }

    // Update customer wallet
    const customer = await Customer.findOneAndUpdate(
      { customer_id },
      { $inc: { wallet: amount } },
      { new: true }
    );

    res.json({
      message: 'Money added to wallet successfully',
      wallet_balance: customer.wallet,
      amount_added: amount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get wallet balance
router.get('/balance', auth, async (req, res) => {
  try {
    const customer_id = req.customer.customer_id;
    
    const customer = await Customer.findOne({ customer_id });
    
    res.json({
      message: 'Wallet balance fetched successfully',
      wallet_balance: customer.wallet
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
