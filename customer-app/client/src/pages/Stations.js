import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { stationsAPI } from '../api';
import QRScanner from '../components/QRScanner';

const Stations = () => {
  const navigate = useNavigate();
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  // QR Scanner states
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanningForStation, setScanningForStation] = useState(null);
  const [activeRide, setActiveRide] = useState(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && true); // Default to dark
  });

  // Predefined locations in Ahmedabad
  const predefinedLocations = [
    { name: 'Naroda', lat: 23.0869, lng: 72.6173 },
    { name: 'Naranpura', lat: 23.0395, lng: 72.5565 },
    { name: 'Maninagar', lat: 23.0104, lng: 72.5950 },
    { name: 'Satellite', lat: 23.0299, lng: 72.5100 },
    { name: 'Bopal', lat: 23.0543, lng: 72.4480 },
    { name: 'SG Highway', lat: 23.0738, lng: 72.5262 },
    { name: 'Vastrapur', lat: 23.0395, lng: 72.5262 },
    { name: 'Paldi', lat: 23.0174, lng: 72.5554 },
    { name: 'CG Road', lat: 23.0304, lng: 72.5404 },
    { name: 'Sabarmati', lat: 23.0607, lng: 72.5774 }
  ];

  // Memoized distance calculation function
  const calculateDistance = useCallback((lat1, lng1, lat2, lng2) => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Dynamically calculate distances for all stations based on current user location
  const stationsWithDynamicDistance = useMemo(() => {
    if (!userLocation || !stations.length) return stations;

    return stations.map(station => ({
      ...station,
      distance: calculateDistance(
        userLocation.lat,
        userLocation.lng,
        station.coordinates?.latitude || station.location?.coordinates?.[1] || 0, // latitude
        station.coordinates?.longitude || station.location?.coordinates?.[0] || 0  // longitude
      )
    })).sort((a, b) => a.distance - b.distance); // Sort by distance
  }, [stations, userLocation, calculateDistance]); useEffect(() => {
    // Load default stations on initial load
    fetchDefaultStations();
    // Don't get user location automatically, let user click button

    // Cleanup location watching on unmount
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const startLocationTracking = () => {
    setLocationLoading(true);

    if (navigator.geolocation) {
      // Get initial position with high accuracy
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          console.log('GPS Location:', newLocation);
          setUserLocation(newLocation);
          fetchNearbyStations(newLocation.lat, newLocation.lng);
          setLocationLoading(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setError(`Location Error: ${error.message}. Please use manual location input.`);
          setLocationLoading(false);
          // Show manual location option
          setShowManualLocation(true);
          // Fallback to Naroda coordinates since user is there
          const defaultLocation = { lat: 23.0869, lng: 72.6173 };
          setUserLocation(defaultLocation);
          fetchNearbyStations(defaultLocation.lat, defaultLocation.lng);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000 // Cache for 30 seconds
        }
      );

      // Start continuous location tracking with high accuracy
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          console.log('Updated GPS Location:', newLocation);
          setUserLocation(newLocation);
        },
        (error) => {
          console.error('Location tracking error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000 // Cache position for 1 minute
        }
      );

      setWatchId(id);
    } else {
      setError('Geolocation is not supported by this browser. Please use manual location input.');
      setLocationLoading(false);
      setShowManualLocation(true);
      const defaultLocation = { lat: 23.0869, lng: 72.6173 }; // Naroda
      setUserLocation(defaultLocation);
      fetchNearbyStations(defaultLocation.lat, defaultLocation.lng);
    }
  };

  const handleManualLocation = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid latitude and longitude values.');
      return;
    }

    if (lat < 22.5 || lat > 23.5 || lng < 72.0 || lng > 73.0) {
      alert('Please enter coordinates within Ahmedabad area (Lat: 22.5-23.5, Lng: 72.0-73.0).');
      return;
    }

    const manualLocation = { lat, lng };
    console.log('Manual Location Set:', manualLocation);
    setUserLocation(manualLocation);
    fetchNearbyStations(lat, lng);
    setShowManualLocation(false);
    setError('');
  };

  const handlePredefinedLocation = (location) => {
    console.log('Predefined Location Selected:', location);
    setUserLocation(location);
    fetchNearbyStations(location.lat, location.lng);
    setShowManualLocation(false);
    setError('');
  }; const getUserLocationAndFetchStations = () => {
    startLocationTracking();
  };

  const fetchDefaultStations = async () => {
    try {
      setLoading(true);
      setError('');

      // Using Ahmedabad coordinates for initial load  
      const lat = 23.0225;
      const lng = 72.5714;

      const response = await fetch(`http://localhost:5000/api/stations/nearby?lat=${lat}&lng=${lng}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stations');
      }

      const data = await response.json();
      console.log('Default stations fetched:', data.stations?.length);
      setStations(data.stations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyStations = async (lat, lng) => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`http://localhost:5000/api/stations/nearby?lat=${lat}&lng=${lng}&radius=5`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch nearby stations');
      }

      const data = await response.json();
      console.log('Fetched stations from API:', data.stations);
      console.log('Number of stations fetched:', data.stations?.length);

      // Calculate distances and sort by distance
      const stationsWithDistance = data.stations?.map(station => {
        const distance = calculateDistance(
          lat,
          lng,
          station.coordinates?.latitude || station.location?.coordinates?.[1] || 0,
          station.coordinates?.longitude || station.location?.coordinates?.[0] || 0
        );
        console.log(`Station ${station.station_name}: ${distance.toFixed(2)}km away at lat:${station.coordinates?.latitude}, lng:${station.coordinates?.longitude}`);
        return {
          ...station,
          distance
        };
      }).sort((a, b) => a.distance - b.distance) || [];

      console.log('Stations with distances:', stationsWithDistance.length);
      setStations(stationsWithDistance);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkGeofence = useCallback((stationLat, stationLng) => {
    if (!userLocation) return false;
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      stationLat,
      stationLng
    );
    return distance <= 0.5; // 500 meters geofence
  }, [userLocation, calculateDistance]);

  const handleStationSelect = (station) => {
    setSelectedStation(station);

    // Geofencing check
    const isInRange = checkGeofence(
      station.coordinates?.latitude || station.location?.coordinates?.[1] || 0,
      station.coordinates?.longitude || station.location?.coordinates?.[0] || 0
    );

    if (!isInRange) {
      alert('WARNING: You are outside the station area. Please move closer to unlock vehicles.');
    }
  };

  // QR Scanner and Ride Management Functions
  const handleUnlockVehicle = (station) => {
    setScanningForStation(station);
    setShowQRScanner(true);
  };

  const handleQRScan = async (scanResult) => {
    try {
      console.log('QR Scan Result:', scanResult);

      // Start the ride
      const response = await fetch('http://localhost:5000/api/rides/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          vehicle_id: scanResult.vehicleId,
          station_id: scanResult.stationId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start ride');
      }

      const rideData = await response.json();
      console.log('Ride started:', rideData);

      // Close scanner
      setShowQRScanner(false);
      setScanningForStation(null);

      // Navigate to active ride page
      navigate('/active-ride', {
        state: {
          rideData: {
            rideId: rideData.ride_id,
            vehicleId: scanResult.vehicleId,
            stationId: scanResult.stationId,
            startTime: new Date().toISOString()
          }
        }
      });

    } catch (error) {
      console.error('Error starting ride:', error);
      setError(error.message);
      setShowQRScanner(false);
    }
  };

  const handleQRScanClose = () => {
    setShowQRScanner(false);
    setScanningForStation(null);
  };

  const themeClasses = {
    bg: isDarkMode ? 'from-black via-gray-900 to-black' : 'from-gray-50 via-white to-gray-100',
    card: isDarkMode ? 'from-gray-800/50 to-gray-900/50 border-evgreen/20' : 'from-white/80 to-gray-50/80 border-evgreen/30',
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    textSecondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
    button: isDarkMode ? 'bg-gray-800/50 hover:bg-gray-700/50' : 'bg-white/50 hover:bg-gray-100/50'
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${themeClasses.bg} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-evgreen mx-auto mb-4"></div>
          <p className={themeClasses.text}>Loading stations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeClasses.bg} p-6`}>
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-4xl font-bold bg-gradient-to-r from-evgreen to-green-300 bg-clip-text text-transparent mb-2`}>
              Charging Stations
            </h1>
            <p className={themeClasses.textSecondary}>Discover and access electric vehicle charging points near you</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto GPS Location Button */}
            <button
              onClick={getUserLocationAndFetchStations}
              disabled={locationLoading}
              className={`${locationLoading
                ? 'bg-gray-500/50 cursor-not-allowed'
                : 'bg-gradient-to-r from-evgreen to-green-400 hover:from-green-400 hover:to-evgreen'
                } text-black px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2`}
            >
              {locationLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  <span>Locating...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>Auto GPS</span>
                </>
              )}
            </button>

            {/* Manual Location Toggle */}
            <button
              onClick={() => setShowManualLocation(!showManualLocation)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <span>Set Location</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`${themeClasses.button} p-3 rounded-xl border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} transition-all duration-300 hover:scale-110 flex items-center justify-center`}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Manual Location Panel */}
        {showManualLocation && (
          <div className={`bg-gradient-to-br ${themeClasses.card} backdrop-blur-sm rounded-2xl p-8 mb-6 border shadow-2xl`}>
            <div className="flex items-center mb-6">
              <div className="bg-evgreen/20 p-3 rounded-xl mr-4">
                <svg className="w-6 h-6 text-evgreen" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className={`font-bold text-xl ${themeClasses.text}`}>Configure Your Location</h3>
            </div>

            {/* Quick Location Buttons for Ahmedabad Areas */}
            <div className="mb-6">
              <p className={`${themeClasses.textSecondary} text-sm mb-4 font-medium`}>Quick Select - Available Stations:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {stations.map((station) => (
                  <button
                    key={station.station_id}
                    onClick={() => handlePredefinedLocation({ name: station.station_name, lat: station.coordinates?.latitude || station.location?.coordinates?.[1], lng: station.coordinates?.longitude || station.location?.coordinates?.[0] })}
                    className="group bg-evgreen/10 hover:bg-evgreen hover:text-black text-evgreen px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg border border-evgreen/20 hover:border-evgreen"
                  >
                    <div className="flex items-center justify-center">
                      <svg className="w-3 h-3 mr-2 opacity-70 group-hover:opacity-100" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {station.station_name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Coordinate Input */}
            <div className="border-t border-gray-300 dark:border-gray-600 pt-6">
              <p className={`${themeClasses.textSecondary} text-sm mb-4 font-medium`}>Custom Coordinates Entry:</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="23.0869"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-evgreen focus:border-evgreen transition-all duration-200"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="72.6173"
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-evgreen focus:border-evgreen transition-all duration-200"
                  />
                </div>
                <button
                  onClick={handleManualLocation}
                  className="bg-gradient-to-r from-evgreen to-green-500 hover:from-green-500 hover:to-evgreen text-black px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Set Location
                </button>
              </div>
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  <span className="inline-flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Pro Tip:
                  </span>
                  For Naroda area, use coordinates 23.0869, 72.6173. Right-click on Google Maps and select "What's here?" to get precise coordinates for any location.
                </p>
              </div>
            </div>
          </div>
        )}        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-6 mb-6">
            <div className="flex items-center">
              <div className="bg-red-500/30 p-3 rounded-xl mr-4">
                <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-red-300 font-bold text-lg mb-1">Error Occurred</h3>
                <p className="text-red-200">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* User Location Status */}
        {userLocation && (
          <div className={`bg-gradient-to-r ${themeClasses.card} backdrop-blur-sm rounded-2xl p-6 mb-6 border shadow-xl`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-evgreen/20 p-3 rounded-xl mr-4">
                  <svg className="w-6 h-6 text-evgreen animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${themeClasses.text}`}>
                    Current Location • {userLocation.accuracy ? `GPS (±${Math.round(userLocation.accuracy)}m)` : 'Manual'}
                  </h3>
                  <p className={themeClasses.textSecondary}>
                    Lat: {userLocation.lat.toFixed(6)}, Lng: {userLocation.lng.toFixed(6)}
                  </p>
                  <p className="text-sm text-evgreen mt-1 flex items-center">
                    <svg className="w-4 h-4 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Distance updates automatically • Last updated: {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-evgreen/20 text-evgreen px-4 py-2 rounded-xl text-sm font-bold mb-3 relative">
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-evgreen rounded-full animate-ping"></span>
                  <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Location Set
                </div>
                <button
                  onClick={() => setShowManualLocation(true)}
                  className="text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-2 rounded-xl transition-colors mb-2 w-full flex items-center justify-center"
                >
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Change Location
                </button>
                <button
                  onClick={startLocationTracking}
                  className="text-xs bg-gray-500/20 hover:bg-evgreen/20 px-3 py-2 rounded-xl transition-colors mb-2 w-full flex items-center justify-center"
                  disabled={locationLoading}
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh GPS
                </button>
                <div className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-xl">
                  <span className="font-medium">Found: {stationsWithDynamicDistance.length} stations</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Location Instructions */}
        {!userLocation && !locationLoading && (
          <div className={`bg-gradient-to-r from-blue-500/10 to-evgreen/10 border border-blue-500/20 rounded-xl p-4 mb-6`}>
            <div className="flex items-center">
              <span className="text-blue-400 text-2xl mr-3">ℹ️</span>
              <div>
                <h3 className={`font-semibold ${themeClasses.text} mb-1`}>Find Stations Near You</h3>
                <p className={themeClasses.textSecondary}>
                  Click "Use My Location" to find the nearest bike stations based on your current location.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stations Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${themeClasses.text}`}>
              {userLocation ? 'Nearby Stations' : 'Available Stations'}
            </h2>
            <p className={themeClasses.textSecondary}>
              {stations.length} station{stations.length !== 1 ? 's' : ''} found
              {userLocation && ' • Sorted by distance'}
            </p>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => userLocation
              ? fetchNearbyStations(userLocation.lat, userLocation.lng)
              : fetchDefaultStations()
            }
            disabled={loading}
            className={`${themeClasses.button} p-3 rounded-full border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} hover:scale-110 transition-all duration-300`}
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
          </button>
        </div>

        {/* Stations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stationsWithDynamicDistance.map((station) => {
            const isInRange = userLocation ? checkGeofence(
              station.coordinates?.latitude || station.location?.coordinates?.[1] || 0,
              station.coordinates?.longitude || station.location?.coordinates?.[0] || 0
            ) : false;

            return (
              <div
                key={station.station_id}
                className={`bg-gradient-to-br ${themeClasses.card} backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer ${selectedStation?.station_id === station.station_id
                  ? 'ring-2 ring-evgreen shadow-evgreen/25'
                  : ''
                  } ${isInRange ? 'border-evgreen shadow-evgreen/10' : ''}`}
                onClick={() => handleStationSelect(station)}
              >
                {/* Station Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold ${themeClasses.text} mb-1`}>
                      {station.station_name}
                    </h3>
                    <p className={`${themeClasses.textSecondary} text-sm`}>
                      {station.station_area}
                    </p>
                  </div>

                  {/* Range Indicator */}
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold ${isInRange
                    ? 'bg-evgreen/20 text-evgreen'
                    : 'bg-orange-500/20 text-orange-400'
                    }`}>
                    {isInRange ? 'In Range' : 'Far'}
                  </div>
                </div>

                {/* Station Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className={`${themeClasses.button} rounded-lg p-3 text-center border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="mb-2 flex justify-center">
                      {/* Capacity Icon: Bike Handlebar */}
                      <svg className="inline w-12 h-12" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="10" y="22" width="28" height="4" rx="2" fill="#22c55e"/>
                        <rect x="12" y="18" width="4" height="8" rx="2" fill="#22c55e"/>
                        <rect x="32" y="18" width="4" height="8" rx="2" fill="#22c55e"/>
                        <circle cx="14" cy="24" r="2" fill="#22c55e"/>
                        <circle cx="34" cy="24" r="2" fill="#22c55e"/>
                      </svg>
                    </div>
                    <div className={`text-base font-semibold ${themeClasses.textSecondary}`}>Capacity</div>
                    <div className={`font-bold text-xl ${themeClasses.text}`}>{station.capacity}</div>
                  </div>

                  <div className={`${themeClasses.button} rounded-lg p-3 text-center border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="mb-2 flex justify-center">
                      {/* Charging Icon: Thunderbolt */}
                      <svg className="inline w-12 h-12" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <polygon points="26,6 14,28 24,28 22,42 36,18 26,18" fill="#3b82f6"/>
                      </svg>
                    </div>
                    <div className={`text-base font-semibold ${themeClasses.textSecondary}`}>Charging</div>
                    <div className={`font-bold text-xl ${themeClasses.text}`}>{station.charging_ports}</div>
                  </div>
                </div>

                {/* Distance and Directions */}
                {userLocation && station.distance !== undefined && (
                  <div className="mb-4">
                    <div className={`flex items-center justify-between ${themeClasses.textSecondary} text-sm`}>
                      <div className="flex items-center">
                        <span className="mr-2 animate-pulse">�</span>
                        <span className="mr-2 animate-pulse">
                          <svg className="inline w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="2" fill="#fff"/></svg>
                        </span>
                        <span className="font-medium transition-all duration-300">
                          {station.distance < 0.1
                            ? `${Math.round(station.distance * 10000) / 10}m`
                            : station.distance < 1
                              ? `${Math.round(station.distance * 1000)}m`
                              : `${station.distance.toFixed(2)}km`
                          }
                          <span className="ml-1 text-xs opacity-75">away</span>
                        </span>
                        {/* Real-time indicator */}
                        <span className="ml-2 w-2 h-2 bg-evgreen rounded-full animate-ping opacity-75"></span>
                      </div>
                      <div className="flex items-center text-xs">
                        <span className="mr-1">⏱️</span>
                        <span className="mr-1">
                          <svg className="inline w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="8" y="12" width="8" height="4" rx="2" fill="#3b82f6"/><rect x="12" y="14" width="4" height="2" rx="1" fill="#fff"/></svg>
                        </span>
                        <span className="transition-all duration-300">
                          ~{Math.round(station.distance * 12)} min walk
                        </span>
                      </div>
                    </div>

                    {/* Enhanced Distance Bar with Animation */}
                    <div className="mt-2 w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2 relative overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-evgreen to-green-400 h-2 rounded-full transition-all duration-500 relative"
                        style={{
                          width: `${Math.max(5, Math.min(100, (2 - station.distance) * 50))}%`
                        }}
                      >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                      </div>
                      {/* Distance markers */}
                      <div className="absolute inset-0 flex justify-between items-center px-1 text-xs">
                        <span className="text-evgreen font-bold">●</span>
                        <span className="text-gray-400">1km</span>
                        <span className="text-gray-400">2km+</span>
                      </div>
                    </div>

                    {/* Additional Distance Info */}
                    <div className="mt-1 flex justify-between text-xs opacity-75">
                      <span>
                        {station.distance < 0.5 ? "🟢 Very Close" :
                          station.distance < 1 ? "Close" :
                            station.distance < 2 ? "Moderate" : "Far"}
                      </span>
                      <span>Updated • Live</span>
                    </div>
                  </div>
                )}

                {/* Default distance display for stations without calculated distance */}
                {(!userLocation || station.distance === undefined) && station.distance && (
                  <div className="mb-4">
                    <div className={`flex items-center ${themeClasses.textSecondary} text-sm`}>
                      <svg className="inline w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="8" y="12" width="8" height="4" rx="2" fill="#3b82f6"/><rect x="12" y="14" width="4" height="2" rx="1" fill="#fff"/></svg>
                      {station.distance.toFixed(2)} km away
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isInRange) {
                        handleUnlockVehicle(station);
                      }
                    }}
                    className={`flex-1 ${isInRange
                      ? 'bg-gradient-to-r from-evgreen to-green-400 text-black hover:from-green-400 hover:to-evgreen'
                      : 'bg-gray-500/50 text-gray-400 cursor-not-allowed'
                      } py-2 px-4 rounded-lg font-semibold transition-all duration-300 ${isInRange ? 'hover:scale-105 shadow-lg' : ''
                      }`}
                    disabled={!isInRange}
                  >
                    <div className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0h-2m8-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {isInRange ? 'Scan QR & Unlock' : 'Move Closer'}
                    </div>
                  </button>

                  {/* Directions Button */}
                  <button
                    className={`${themeClasses.button} p-2 rounded-lg border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} hover:scale-110 transition-all duration-300 text-sm`}
                    onClick={(e) => {
                      e.stopPropagation();
                      const lat = station.coordinates?.latitude || station.location?.coordinates?.[1] || 0;
                      const lng = station.coordinates?.longitude || station.location?.coordinates?.[0] || 0;
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
                      window.open(url, '_blank');
                    }}
                    title="Get Directions"
                  >
                    <svg className="inline w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="2" y="6" width="20" height="12" rx="6" fill="#3b82f6"/><rect x="10" y="12" width="4" height="2" rx="1" fill="#fff"/></svg>
                  </button>

                  <button
                    className={`${themeClasses.button} p-2 rounded-lg border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} hover:scale-110 transition-all duration-300`}
                    title="View Details"
                  >
                    <svg className="inline w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth="2"><circle cx="12" cy="12" r="10" fill="#fff"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* No Stations Message */}
        {stations.length === 0 && !loading && (
          <div className="text-center py-12">
           
            <h3 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>No Stations Found</h3>
            <p className={themeClasses.textSecondary}>
              {userLocation
                ? "No stations found in your area. Try expanding your search radius."
                : "We're working on adding more stations in your area."}
            </p>
            <div className="flex gap-4 justify-center mt-6">
              <button
                onClick={() => userLocation
                  ? fetchNearbyStations(userLocation.lat, userLocation.lng)
                  : fetchDefaultStations()
                }
                className="bg-gradient-to-r from-evgreen to-green-400 text-black px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
              >
                🔄 Refresh Stations
              </button>
              {!userLocation && (
                <button
                  onClick={getUserLocationAndFetchStations}
                  disabled={locationLoading}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-all duration-300 shadow-lg disabled:opacity-50"
                >
                  📍 Find Near Me
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Geofence Alert Overlay */}
      {selectedStation && !checkGeofence(
        selectedStation.coordinates?.latitude || selectedStation.location?.coordinates?.[1] || 0,
        selectedStation.coordinates?.longitude || selectedStation.location?.coordinates?.[0] || 0
      ) && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className={`bg-gradient-to-br ${themeClasses.card} backdrop-blur-sm rounded-2xl p-8 m-4 max-w-md border shadow-2xl`}>
              <div className="text-center">
                <div className="bg-yellow-500/20 p-6 rounded-full mb-6 mx-auto w-fit">
                  <svg className="w-12 h-12 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className={`text-2xl font-bold ${themeClasses.text} mb-4`}>
                  Outside Station Range
                </h3>
                <p className={`${themeClasses.textSecondary} mb-6 leading-relaxed`}>
                  You need to be within 500 meters of the station to unlock bikes.
                  Please move closer to {selectedStation.station_name}.
                </p>
                <button
                  onClick={() => setSelectedStation(null)}
                  className="bg-gradient-to-r from-evgreen to-green-400 text-black px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all duration-300 shadow-xl flex items-center justify-center mx-auto"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Understood
                </button>
              </div>
            </div>
          </div>
        )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={handleQRScanClose}
          stationId={scanningForStation?.station_id}
        />
      )}
    </div>
  );
};

export default Stations;
