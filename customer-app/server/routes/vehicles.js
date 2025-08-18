const express = require('express');
const Vehicle = require('../models/Vehicle');
const auth = require('../middleware/auth');
const router = express.Router();

// Get vehicle details
router.get('/:id', auth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ vehicle_id: req.params.id });
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.json({
      message: 'Vehicle details fetched successfully',
      vehicle
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update vehicle battery (simulate battery decrease)
router.put('/:id/battery', auth, async (req, res) => {
  try {
    const { battery } = req.body;
    
    if (battery < 0 || battery > 100) {
      return res.status(400).json({ message: 'Battery must be between 0 and 100' });
    }

    const vehicle = await Vehicle.findOneAndUpdate(
      { vehicle_id: req.params.id },
      { battery },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.json({
      message: 'Vehicle battery updated successfully',
      vehicle
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Scan QR code
router.post('/scan', auth, async (req, res) => {
  try {
    const { qr_code } = req.body;
    
    const vehicle = await Vehicle.findOne({ qr_code });
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Invalid QR code' });
    }

    if (vehicle.status !== 'available') {
      return res.status(400).json({ message: 'Vehicle is not available' });
    }

    if (vehicle.battery < 20) {
      return res.status(400).json({ message: 'Vehicle battery is too low' });
    }

    res.json({
      message: 'QR code is valid',
      vehicle: {
        vehicle_id: vehicle.vehicle_id,
        vehicle_name: vehicle.vehicle_name,
        station_id: vehicle.station_id,
        battery: vehicle.battery
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
