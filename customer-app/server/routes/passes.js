const express = require('express');
const RidePass = require('../models/RidePass');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');
const router = express.Router();

// Buy monthly pass
router.post('/buy', auth, async (req, res) => {
  try {
    const { pass_type } = req.body; // 'monthly' or 'weekly'
    const customer_id = req.customer.customer_id;

    // Define pass prices
    const passPrices = {
      monthly: 999,
      weekly: 299
    };

    const price = passPrices[pass_type];
    if (!price) {
      return res.status(400).json({ message: 'Invalid pass type' });
    }

    // Check if customer has sufficient balance
    if (req.customer.wallet < price) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Check if customer already has an active pass
    const activePass = await RidePass.findOne({
      customer_id,
      status: 'active',
      end_date: { $gt: new Date() }
    });

    if (activePass) {
      return res.status(400).json({ message: 'You already have an active pass' });
    }

    // Calculate end date
    const start_date = new Date();
    const end_date = new Date();
    if (pass_type === 'monthly') {
      end_date.setMonth(end_date.getMonth() + 1);
    } else if (pass_type === 'weekly') {
      end_date.setDate(end_date.getDate() + 7);
    }

    // Generate pass_id
    const pass_id = `PASS_${Date.now()}_${customer_id}`;

    // Create pass
    const ridePass = new RidePass({
      pass_id,
      customer_id,
      price_paid: price,
      start_date,
      end_date
    });

    await ridePass.save();

    // Update customer wallet
    await Customer.findOneAndUpdate(
      { customer_id },
      { $inc: { wallet: -price } }
    );

    res.status(201).json({
      message: 'Pass purchased successfully',
      pass: {
        pass_id: ridePass.pass_id,
        type: pass_type,
        price_paid: ridePass.price_paid,
        start_date: ridePass.start_date,
        end_date: ridePass.end_date
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current pass info
router.get('/', auth, async (req, res) => {
  try {
    const customer_id = req.customer.customer_id;
    
    const activePass = await RidePass.findOne({
      customer_id,
      status: 'active',
      end_date: { $gt: new Date() }
    });

    if (!activePass) {
      return res.json({
        message: 'No active pass found',
        pass: null
      });
    }

    res.json({
      message: 'Active pass found',
      pass: activePass
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get pass history
router.get('/history', auth, async (req, res) => {
  try {
    const customer_id = req.customer.customer_id;
    
    const passes = await RidePass.find({ customer_id })
      .sort({ start_date: -1 })
      .limit(20);

    res.json({
      message: 'Pass history fetched successfully',
      passes
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
