const express = require('express');
const Vehicle = require('../models/Vehicle');
const auth = require('../middleware/auth');
const router = express.Router();

// Get vehicle details by ID or QR code
router.get('/:id', auth, async (req, res) => {
  try {
    const vehicleIdentifier = req.params.id;
    
    console.log('Looking up vehicle with identifier:', vehicleIdentifier);
    
    // Try to find vehicle by vehicle_id first, then by QR code
    let vehicle = await Vehicle.findOne({ vehicle_id: vehicleIdentifier });
    
    if (!vehicle) {
      // If not found by vehicle_id, try by QR code
      vehicle = await Vehicle.findOne({ qr_code: vehicleIdentifier });
    }
    
    if (!vehicle) {
      console.log('Vehicle not found for identifier:', vehicleIdentifier);
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    console.log('Found vehicle:', vehicle.vehicle_id);

    res.json({
      message: 'Vehicle details fetched successfully',
      vehicle
    });
  } catch (error) {
    console.error('Get vehicle error:', error);
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

// Scan QR code or get vehicle by ID
router.post('/scan', auth, async (req, res) => {
  try {
    const { qr_code } = req.body;
    
    if (!qr_code) {
      return res.status(400).json({ message: 'QR code or vehicle ID is required' });
    }

    console.log('Looking up vehicle with QR/ID:', qr_code);
    
    // Try to find vehicle by QR code first, then by vehicle_id
    let vehicle = await Vehicle.findOne({ qr_code: qr_code });
    
    if (!vehicle) {
      // If not found by QR code, try by vehicle_id
      vehicle = await Vehicle.findOne({ vehicle_id: qr_code });
    }
    
    if (!vehicle) {
      console.log('Vehicle not found for:', qr_code);
      return res.status(404).json({ message: 'Vehicle not found. Please check the QR code or vehicle ID.' });
    }

    console.log('Found vehicle:', vehicle.vehicle_id, 'Status:', vehicle.status);

    if (vehicle.status !== 'available') {
      return res.status(400).json({ 
        message: `Vehicle is currently ${vehicle.status}. Please choose another vehicle.` 
      });
    }

    if (vehicle.battery < 20) {
      return res.status(400).json({ 
        message: `Vehicle battery is too low (${vehicle.battery}%). Please choose another vehicle.` 
      });
    }

    res.json({
      message: 'Vehicle is available',
      vehicle: {
        vehicle_id: vehicle.vehicle_id,
        vehicle_name: vehicle.vehicle_name,
        vehicle_number: vehicle.vehicle_number,
        station_id: vehicle.station_id,
        battery: vehicle.battery,
        type: vehicle.type,
        model: vehicle.model,
        status: vehicle.status,
        qr_code: vehicle.qr_code,
        odometer_reading: vehicle.odometer_reading,
        rental_rate: vehicle.rental_rate
      }
    });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
