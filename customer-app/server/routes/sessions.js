const express = require('express');
const ActiveRideSession = require('../models/ActiveRideSession');
const RideHistory = require('../models/RideHistory');
const Vehicle = require('../models/Vehicle');
const auth = require('../middleware/auth');
const router = express.Router();

// Check for active ride session
router.get('/check-active', auth, async (req, res) => {
  try {
    const customer_id = req.customer.customer_id;
    
    // Check for active ride session
    const activeSession = await ActiveRideSession.findOne({ 
      customer_id, 
      session_active: true 
    });
    
    if (!activeSession) {
      return res.json({
        has_active_ride: false,
        message: 'No active ride found'
      });
    }
    
    // Get ride details
    const ride = await RideHistory.findOne({ 
      ride_id: activeSession.ride_id,
      status: 'ongoing'
    });
    
    if (!ride) {
      // Clean up orphaned session
      await ActiveRideSession.deleteOne({ _id: activeSession._id });
      return res.json({
        has_active_ride: false,
        message: 'No active ride found'
      });
    }
    
    // Get vehicle details
    const vehicle = await Vehicle.findOne({ vehicle_id: activeSession.vehicle_id });
    
    // Calculate elapsed time and estimated fare
    const elapsedMinutes = Math.floor((Date.now() - new Date(activeSession.session_start_time)) / (1000 * 60));
    const estimatedDistance = activeSession.total_distance;
    const estimatedFare = 5 + (estimatedDistance * 2) + (elapsedMinutes * 1); // Base + distance + time
    
    res.json({
      has_active_ride: true,
      ride_session: {
        ride_id: activeSession.ride_id,
        vehicle_id: activeSession.vehicle_id,
        vehicle_name: vehicle?.vehicle_name,
        vehicle_battery: vehicle?.battery,
        start_time: activeSession.session_start_time,
        elapsed_minutes: elapsedMinutes,
        total_distance: estimatedDistance,
        estimated_fare: estimatedFare,
        current_location: activeSession.current_location,
        start_location: activeSession.start_location,
        pickup_station_id: ride.pickup_station_id
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update ride session (ping to keep alive and update location)
router.post('/update-session', auth, async (req, res) => {
  try {
    const customer_id = req.customer.customer_id;
    const { latitude, longitude, distance_increment } = req.body;
    
    const activeSession = await ActiveRideSession.findOneAndUpdate(
      { customer_id, session_active: true },
      {
        last_ping_time: new Date(),
        current_location: {
          latitude: latitude || 0,
          longitude: longitude || 0
        },
        $inc: { total_distance: distance_increment || 0 }
      },
      { new: true }
    );
    
    if (!activeSession) {
      return res.status(404).json({ message: 'No active session found' });
    }
    
    // Update vehicle battery (simulate decrease based on distance)
    if (distance_increment && distance_increment > 0) {
      const batteryDecrease = Math.floor(distance_increment * 0.5); // 0.5% per km
      await Vehicle.findOneAndUpdate(
        { vehicle_id: activeSession.vehicle_id },
        { $inc: { battery: -batteryDecrease } }
      );
    }
    
    // Calculate current stats
    const elapsedMinutes = Math.floor((Date.now() - new Date(activeSession.session_start_time)) / (1000 * 60));
    const currentFare = 5 + (activeSession.total_distance * 2) + (elapsedMinutes * 1);
    
    res.json({
      message: 'Session updated successfully',
      session_stats: {
        elapsed_minutes: elapsedMinutes,
        total_distance: activeSession.total_distance,
        current_fare: currentFare,
        last_updated: activeSession.last_ping_time
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Start ride session
router.post('/start-session', auth, async (req, res) => {
  try {
    const customer_id = req.customer.customer_id;
    const { ride_id, vehicle_id, latitude, longitude, browser_session_id } = req.body;
    
    // Check if user already has an active session
    const existingSession = await ActiveRideSession.findOne({ 
      customer_id, 
      session_active: true 
    });
    
    if (existingSession) {
      return res.status(400).json({ message: 'You already have an active ride session' });
    }
    
    // Create new session
    const session = new ActiveRideSession({
      customer_id,
      ride_id,
      vehicle_id,
      session_start_time: new Date(),
      start_location: {
        latitude: latitude || 0,
        longitude: longitude || 0
      },
      current_location: {
        latitude: latitude || 0,
        longitude: longitude || 0
      },
      browser_session_id: browser_session_id || 'default'
    });
    
    await session.save();
    
    res.status(201).json({
      message: 'Ride session started successfully',
      session_id: session._id,
      ride_id: session.ride_id
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// End ride session
router.post('/end-session', auth, async (req, res) => {
  try {
    const customer_id = req.customer.customer_id;
    const { ride_id } = req.body;
    
    // Find and deactivate session
    const session = await ActiveRideSession.findOneAndUpdate(
      { customer_id, ride_id, session_active: true },
      { session_active: false },
      { new: true }
    );
    
    if (!session) {
      return res.status(404).json({ message: 'No active session found for this ride' });
    }
    
    // Calculate final stats
    const totalMinutes = Math.floor((Date.now() - new Date(session.session_start_time)) / (1000 * 60));
    const finalFare = 5 + (session.total_distance * 2) + (totalMinutes * 1);
    
    res.json({
      message: 'Ride session ended successfully',
      final_stats: {
        total_minutes: totalMinutes,
        total_distance: session.total_distance,
        final_fare: finalFare,
        session_duration: session.session_start_time + ' to ' + new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Force end inactive sessions (cleanup endpoint)
router.post('/cleanup-inactive', auth, async (req, res) => {
  try {
    // Mark sessions as inactive if no ping for more than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const result = await ActiveRideSession.updateMany(
      { 
        last_ping_time: { $lt: thirtyMinutesAgo },
        session_active: true 
      },
      { session_active: false }
    );
    
    res.json({
      message: 'Cleanup completed',
      sessions_deactivated: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
