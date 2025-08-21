const express = require('express');
const RideHistory = require('../models/RideHistory');
const Vehicle = require('../models/Vehicle');
const Customer = require('../models/Customer');
const ParkingStation = require('../models/ParkingStation');
const ActiveRideSession = require('../models/ActiveRideSession');
const auth = require('../middleware/auth');
const router = express.Router();

// Debug route to check request data
router.post('/debug', auth, async (req, res) => {
  try {
    res.json({
      message: 'Debug info',
      request_body: req.body,
      customer_info: {
        customer_id: req.customer.customer_id,
        customer_name: req.customer.customer_name,
        email: req.customer.email,
        wallet: req.customer.wallet
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Debug error', error: error.message });
  }
});

// Start ride
router.post('/start', auth, async (req, res) => {
  try {
    const { vehicle_id, station_id, start_station_id, start_location } = req.body;
    const customer_id = req.customer.customer_id;

    // Handle both station_id and start_station_id for compatibility
    const stationId = station_id || start_station_id;

    console.log('Start ride request:', { vehicle_id, stationId, customer_id });

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
    const rideData = {
      ride_id,
      customer_id,
      user_id: customer_id, // Map to admin-app field
      user_name: req.customer.customer_name || req.customer.name || `Customer ${customer_id}`,
      vehicle_id,
      vehicle_number: vehicle.vehicle_number || vehicle_id,
      station_id: stationId, // Start station ID
      start_time: new Date()
    };

    console.log('Creating ride with data:', rideData);
    
    const ride = new RideHistory(rideData);
    await ride.save();
    console.log('Ride saved successfully');

    // Update vehicle status
    await Vehicle.findOneAndUpdate(
      { vehicle_id },
      { status: 'in_use' }
    );
    console.log('Vehicle status updated to in_use');

    // Remove any existing active session for this customer
    await ActiveRideSession.deleteMany({ customer_id });
    console.log('Cleaned up existing sessions');

    // Create active session for ride persistence
    const sessionData = {
      customer_id,
      ride_id: ride.ride_id,
      vehicle_id,
      session_start_time: new Date(),
      start_location: start_location || {
        latitude: req.body.latitude || 0,
        longitude: req.body.longitude || 0
      },
      browser_session_id: req.body.browser_session_id || `session_${Date.now()}`
    };

    console.log('Creating session with data:', sessionData);
    const activeSession = new ActiveRideSession(sessionData);
    await activeSession.save();
    console.log('Active session created successfully');

    console.log('Ride started successfully:', ride_id);

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
    console.error('Start ride error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// End ride
router.post('/end', auth, async (req, res) => {
  try {
    const { ride_id, drop_station_id, end_station_id, distance, total_time, end_location } = req.body;
    const customer_id = req.customer.customer_id;

    // Handle both drop_station_id and end_station_id for compatibility
    const endStationId = drop_station_id || end_station_id;

    console.log('End ride request:', { ride_id, endStationId, distance, total_time, customer_id });

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
    const distanceFare = (distance || 0) * 2;
    const timeFare = (total_time || 0) * 1;
    const totalFare = baseFare + distanceFare + timeFare;

    console.log('Calculated fare:', { baseFare, distanceFare, timeFare, totalFare });

    // Check if customer has sufficient balance
    if (req.customer.wallet < totalFare) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Update ride with end station information
    ride.drop_station_id = endStationId; // End station ID (different from start station)
    ride.distance_km = distance || 0;
    ride.duration_minutes = total_time || 0;
    ride.end_time = new Date();
    ride.fare = totalFare;
    ride.amount = totalFare; // Alias for admin-app compatibility
    ride.status = 'completed';
    ride.payment_status = 'paid';
    
    // Store end location if provided
    if (end_location) {
      ride.end_location = end_location;
    }

    await ride.save();
    console.log('Ride updated successfully');

    // Update customer wallet
    await Customer.findOneAndUpdate(
      { customer_id },
      { $inc: { wallet: -totalFare } }
    );
    console.log('Customer wallet updated');

    // Update vehicle status and move to end station
    await Vehicle.findOneAndUpdate(
      { vehicle_id: ride.vehicle_id },
      { 
        status: 'available',
        station_id: endStationId || ride.station_id // Move to end station or keep at start station
      }
    );
    console.log('Vehicle status and location updated');

    // Deactivate the ride session
    await ActiveRideSession.findOneAndUpdate(
      { customer_id, ride_id, session_active: true },
      { session_active: false }
    );
    console.log('Active session deactivated');

    res.json({
      message: 'Ride ended successfully',
      ride: {
        ride_id: ride.ride_id,
        start_station_id: ride.station_id,
        end_station_id: ride.drop_station_id,
        distance_km: ride.distance_km,
        duration_minutes: ride.duration_minutes,
        fare: ride.fare,
        start_time: ride.start_time,
        end_time: ride.end_time
      }
    });
  } catch (error) {
    console.error('End ride error:', error);
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
