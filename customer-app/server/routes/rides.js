const express = require('express');
const RideHistory = require('../models/RideHistory');
const Vehicle = require('../models/Vehicle');
const Customer = require('../models/Customer');
const ParkingStation = require('../models/ParkingStation');
const ActiveRideSession = require('../models/ActiveRideSession');
const auth = require('../middleware/auth');
const router = express.Router();

// Start ride
router.post('/start', auth, async (req, res) => {
  try {
    const { vehicle_id, station_id } = req.body;
    const customer_id = req.customer.customer_id;

    // Check if customer has sufficient wallet balance
    if (req.customer.wallet < 50) {
      return res.status(400).json({ message: 'Insufficient wallet balance. Minimum ₹50 required.' });
    }

    // Check if vehicle is available
    const vehicle = await Vehicle.findOne({ vehicle_id });
    if (!vehicle || vehicle.status !== 'available') {
      return res.status(400).json({ message: 'Vehicle is not available' });
    }

    // Check if customer has any ongoing ride
    const ongoingRide = await RideHistory.findOne({ 
      customer_id, 
      status: 'active' 
    });
    
    if (ongoingRide) {
      return res.status(400).json({ message: 'You already have an active ride' });
    }

    // Generate ride_id
    const ride_id = `RIDE_${Date.now()}_${customer_id}`;

    // Create ride
    const ride = new RideHistory({
      ride_id,
      customer_id,
      user_id: customer_id, // Map to admin-app field
      user_name: req.customer.customer_name,
      vehicle_id,
      vehicle_number: vehicle.vehicle_number || vehicle_id,
      station_id: station_id,
      start_time: new Date()
    });

    await ride.save();

    // Update vehicle status
    await Vehicle.findOneAndUpdate(
      { vehicle_id },
      { status: 'in_use' }
    );

    // Create active session for ride persistence
    const sessionData = {
      customer_id,
      ride_id: ride.ride_id,
      vehicle_id,
      session_start_time: new Date(),
      start_location: {
        latitude: req.body.latitude || 0,
        longitude: req.body.longitude || 0
      },
      browser_session_id: req.body.browser_session_id || `session_${Date.now()}`
    };

    const activeSession = new ActiveRideSession(sessionData);
    await activeSession.save();

    res.status(201).json({
      message: 'Ride started successfully',
      ride: {
        ride_id: ride.ride_id,
        vehicle_id: ride.vehicle_id,
        station_id: ride.station_id,
        start_time: ride.start_time
      },
      session_id: activeSession._id,
      redirect_to_ride_page: true
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// End ride
router.post('/end', auth, async (req, res) => {
  try {
    const { ride_id, drop_station_id, distance, total_time } = req.body;
    const customer_id = req.customer.customer_id;

    // Find the ride
    const ride = await RideHistory.findOne({ ride_id, customer_id });
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.status !== 'active') {
      return res.status(400).json({ message: 'Ride is not active' });
    }

    // Calculate fare (₹5 base + ₹2 per km + ₹1 per minute)
    const baseFare = 5;
    const distanceFare = distance * 2;
    const timeFare = total_time * 1;
    const totalFare = baseFare + distanceFare + timeFare;

    // Check if customer has sufficient balance
    if (req.customer.wallet < totalFare) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Update ride
    ride.station_id = drop_station_id; // Update end station
    ride.distance_km = distance;
    ride.duration_minutes = total_time;
    ride.end_time = new Date();
    ride.fare = totalFare;
    ride.amount = totalFare; // Alias for admin-app compatibility
    ride.status = 'completed';
    ride.payment_status = 'paid';
    await ride.save();

    // Update customer wallet
    await Customer.findOneAndUpdate(
      { customer_id },
      { $inc: { wallet: -totalFare } }
    );

    // Update vehicle status and station
    await Vehicle.findOneAndUpdate(
      { vehicle_id: ride.vehicle_id },
      { 
        status: 'available',
        station_id: drop_station_id
      }
    );

    // Deactivate the ride session
    await ActiveRideSession.findOneAndUpdate(
      { customer_id, ride_id, session_active: true },
      { session_active: false }
    );

    res.json({
      message: 'Ride ended successfully',
      ride: {
        ride_id: ride.ride_id,
        distance_km: ride.distance_km,
        duration_minutes: ride.duration_minutes,
        fare: ride.fare,
        start_time: ride.start_time,
        end_time: ride.end_time
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get ride history
router.get('/history', auth, async (req, res) => {
  try {
    const customer_id = req.customer.customer_id;
    
    const rides = await RideHistory.find({ customer_id })
      .sort({ start_time: -1 })
      .limit(50);

    res.json({
      message: 'Ride history fetched successfully',
      rides
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get specific ride details
router.get('/:id', auth, async (req, res) => {
  try {
    const customer_id = req.customer.customer_id;
    const ride = await RideHistory.findOne({ 
      ride_id: req.params.id, 
      customer_id 
    });

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    res.json({
      message: 'Ride details fetched successfully',
      ride
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Alert for geofencing violation
router.post('/alert', auth, async (req, res) => {
  try {
    const { ride_id, alert_type, coordinates } = req.body;
    
    // Log the alert (you can save this to database if needed)
    console.log(`Alert: ${alert_type} for ride ${ride_id} at coordinates:`, coordinates);
    
    // You can implement additional actions here like:
    // - Send notification to customer
    // - Alert admin
    // - Start timer for theft protection
    
    res.json({
      message: 'Alert logged successfully',
      alert_type,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
