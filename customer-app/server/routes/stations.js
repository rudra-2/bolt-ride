const express = require('express');
const ParkingStation = require('../models/ParkingStation');
const Vehicle = require('../models/Vehicle');
const auth = require('../middleware/auth');
const router = express.Router();

// Get nearby stations
router.get('/nearby', auth, async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    // Get all stations
    const stations = await ParkingStation.find();

    // Calculate distance and sort
    const stationsWithDistance = stations.map(station => {
      const distance = calculateDistance(
        userLat, userLng,
        station.coordinates.latitude,
        station.coordinates.longitude
      );
      return { ...station._doc, distance };
    });

    // Sort by distance
    stationsWithDistance.sort((a, b) => a.distance - b.distance);

    res.json({
      message: 'Nearby stations fetched successfully',
      stations: stationsWithDistance
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get station details
router.get('/:id', auth, async (req, res) => {
  try {
    const station = await ParkingStation.findOne({ station_id: req.params.id });
    
    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }

    res.json({
      message: 'Station details fetched successfully',
      station
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get vehicles at station
router.get('/:id/vehicles', auth, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ 
      station_id: req.params.id,
      status: 'available',
      battery: { $gte: 20 } // Only show vehicles with at least 20% battery
    });

    res.json({
      message: 'Available vehicles fetched successfully',
      vehicles
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  return distance;
}

module.exports = router;
