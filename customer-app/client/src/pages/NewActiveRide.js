import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, Circle, Popup, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { stationsAPI, ridesAPI, walletAPI } from "../api";
import Navbar from "../components/Navbar";

const ActiveRide = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { rideId, vehicleDetails, startStation, userLocation: initialLocation } = location.state || {};
  
  const [currentLocation, setCurrentLocation] = useState(initialLocation);
  const [ridePath, setRidePath] = useState([]);
  const [rideTime, setRideTime] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [currentFare, setCurrentFare] = useState(0);
  const [nearbyStations, setNearbyStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rideStartTime] = useState(new Date());
  const [showEmergencyContact, setShowEmergencyContact] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  // Ahmedabad City Boundary Coordinates (same as Dashboard)
  const ahmedabadBoundary = [
    [23.1685, 72.4285], [23.1685, 72.7714], [23.0950, 72.7714], [22.9876, 72.7285],
    [22.9500, 72.6428], [22.9750, 72.5571], [23.0100, 72.4571], [23.0800, 72.4142],
    [23.1400, 72.4000], [23.1685, 72.4285]
  ];

  const isWithinCityBoundary = (lat, lng) => {
    let inside = false;
    for (let i = 0, j = ahmedabadBoundary.length - 1; i < ahmedabadBoundary.length; j = i++) {
      if (((ahmedabadBoundary[i][0] > lat) !== (ahmedabadBoundary[j][0] > lat)) &&
          (lng < (ahmedabadBoundary[j][1] - ahmedabadBoundary[i][1]) * (lat - ahmedabadBoundary[i][0]) / (ahmedabadBoundary[j][0] - ahmedabadBoundary[i][0]) + ahmedabadBoundary[i][1])) {
        inside = !inside;
      }
    }
    return inside;
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const checkGeofence = (stationLat, stationLng) => {
    if (!currentLocation) return false;
    const distance = calculateDistance(
      currentLocation.lat, currentLocation.lng,
      stationLat, stationLng
    );
    return distance <= 0.5; // 500 meters
  };

  useEffect(() => {
    if (!rideId || !vehicleDetails) {
      navigate('/dashboard');
      return;
    }

    // Update location every 5 seconds
    const locationInterval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy
            };
            
            // Update current location
            setCurrentLocation(newLocation);
            
            // Add to ride path
            setRidePath(prev => [...prev, [newLocation.lat, newLocation.lng]]);
            
            // Calculate total distance
            if (ridePath.length > 0) {
              const lastPoint = ridePath[ridePath.length - 1];
              const segmentDistance = calculateDistance(
                lastPoint[0], lastPoint[1],
                newLocation.lat, newLocation.lng
              );
              setTotalDistance(prev => prev + segmentDistance);
            }
          },
          (error) => console.error('Location error:', error),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
        );
      }
    }, 5000);

    // Update ride time every second
    const timeInterval = setInterval(() => {
      const currentTime = new Date();
      const elapsedTime = Math.floor((currentTime - rideStartTime) / 1000);
      setRideTime(elapsedTime);
      
      // Calculate fare: ₹5 base + ₹2 per km + ₹1 per minute (as per backend logic)
      const minutes = Math.floor(elapsedTime / 60);
      const baseFare = 5;
      const distanceFare = totalDistance * 2;
      const timeFare = minutes * 1;
      const fare = baseFare + distanceFare + timeFare;
      setCurrentFare(Math.max(fare, 5)); // Minimum ₹5
      
      // Check if wallet balance is sufficient
      if (walletBalance < fare && fare > 5) {
        setError(`Insufficient wallet balance! Current fare: ₹${fare.toFixed(2)}, Wallet: ₹${walletBalance.toFixed(2)}`);
      } else if (error.includes('Insufficient wallet balance')) {
        setError(''); // Clear error if balance is now sufficient
      }
    }, 1000);

    // Fetch nearby stations
    fetchNearbyStations();

    // Fetch wallet balance
    fetchWalletBalance();

    return () => {
      clearInterval(locationInterval);
      clearInterval(timeInterval);
    };
  }, [rideId, vehicleDetails, navigate, rideStartTime, totalDistance, ridePath]);

  const fetchNearbyStations = async () => {
    if (!currentLocation) return;
    
    try {
      const response = await stationsAPI.getNearby(currentLocation.lat, currentLocation.lng);
      setNearbyStations(response.data.stations || response.data);
    } catch (err) {
      console.error('Error fetching stations:', err);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const response = await walletAPI.getBalance();
      setWalletBalance(response.data.wallet_balance || 0);
    } catch (err) {
      console.error('Error fetching wallet balance:', err);
    }
  };

  const handleEndRide = async (endStation) => {
    if (!checkGeofence(
      endStation.coordinates?.latitude || endStation.location?.coordinates?.[1] || 0,
      endStation.coordinates?.longitude || endStation.location?.coordinates?.[0] || 0
    )) {
      setError("You must be within 500 meters of a station to end the ride.");
      return;
    }

    setLoading(true);
    try {
      const endRideData = {
        ride_id: rideId,
        drop_station_id: endStation.station_id, // Use drop_station_id as per backend model
        end_location: {
          latitude: currentLocation.lat,
          longitude: currentLocation.lng
        },
        distance: totalDistance, // Use 'distance' as per backend
        total_time: Math.floor(rideTime / 60) // Convert seconds to minutes as per backend
      };

      console.log('Ending ride with data:', endRideData);
      
      const response = await ridesAPI.end(endRideData);
      console.log('End ride response:', response.data);

      // Navigate back to dashboard with success message
      navigate('/dashboard', {
        state: {
          message: `Ride completed! Total fare: ₹${response.data.ride?.fare || currentFare.toFixed(2)}`
        }
      });
    } catch (err) {
      console.error('End ride error:', err);
      setError(err.response?.data?.message || 'Failed to end ride');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!rideId || !vehicleDetails) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No active ride found</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-evgreen text-black px-6 py-3 rounded-lg font-semibold"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
      <Navbar profile={{}} walletBalance={walletBalance} onLogout={() => navigate('/login')} />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-evgreen">Active Ride</h1>
            <p className="text-gray-300">Vehicle: {vehicleDetails.vehicle_id}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-evgreen">₹{currentFare.toFixed(2)}</div>
            <div className="text-sm text-gray-400">Current Fare</div>
            <div className="text-sm text-blue-400 mt-1">Wallet: ₹{walletBalance.toFixed(2)}</div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
            <span className="text-red-300">{error}</span>
          </div>
        )}

        {/* Ride Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gray-800/80 rounded-xl p-6 text-center border border-gray-700/50">
            <div className="text-3xl font-bold text-blue-400">{formatTime(rideTime)}</div>
            <div className="text-gray-400">Ride Time</div>
          </div>
          <div className="bg-gray-800/80 rounded-xl p-6 text-center border border-gray-700/50">
            <div className="text-3xl font-bold text-evgreen">{totalDistance.toFixed(2)} km</div>
            <div className="text-gray-400">Distance</div>
          </div>
          <div className="bg-gray-800/80 rounded-xl p-6 text-center border border-gray-700/50">
            <div className="text-3xl font-bold text-orange-400">
              {totalDistance > 0 ? ((totalDistance / (rideTime / 3600)).toFixed(1)) : '0.0'} km/h
            </div>
            <div className="text-gray-400">Avg Speed</div>
          </div>
          <div className="bg-gray-800/80 rounded-xl p-6 text-center border border-gray-700/50">
            <button
              onClick={() => setShowEmergencyContact(true)}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
            >
              🚨 Emergency
            </button>
            <div className="text-gray-400 text-sm mt-1">Contact Help</div>
          </div>
        </div>

        {/* Emergency Contact Modal */}
        {showEmergencyContact && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700">
              <h3 className="text-xl font-bold text-red-400 mb-4">🚨 Emergency Contact</h3>
              <div className="space-y-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h4 className="font-semibold text-evgreen mb-2">Customer Support</h4>
                  <p className="text-white text-lg font-bold">📞 +91 9876543210</p>
                  <p className="text-gray-400 text-sm">24/7 Support Available</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-400 mb-2">Police Emergency</h4>
                  <p className="text-white text-lg font-bold">📞 100</p>
                  <p className="text-gray-400 text-sm">For serious emergencies</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-400 mb-2">Your Current Location</h4>
                  <p className="text-white text-sm">
                    Lat: {currentLocation?.lat?.toFixed(6)}<br/>
                    Lng: {currentLocation?.lng?.toFixed(6)}
                  </p>
                  <p className="text-gray-400 text-xs">Share this with emergency services</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEmergencyContact(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                >
                  Close
                </button>
                <a
                  href="tel:+919876543210"
                  className="flex-1 bg-evgreen hover:bg-green-600 text-black py-2 px-4 rounded-lg font-semibold text-center transition-colors"
                >
                  Call Support
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Map */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700/50">
              <h2 className="text-xl font-bold mb-4">Live Tracking</h2>
              <div className="h-80 rounded-xl overflow-hidden border-2 border-evgreen">
                {currentLocation ? (
                  <MapContainer
                    center={[currentLocation.lat, currentLocation.lng]}
                    zoom={15}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution="&copy; OpenStreetMap contributors"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* Ahmedabad City Boundary */}
                    <Polygon 
                      positions={ahmedabadBoundary} 
                      color="#22c55e" 
                      weight={2}
                      fillColor="#22c55e" 
                      fillOpacity={0.05}
                      dashArray="5, 10"
                    />
                    
                    {/* Current Location */}
                    <Marker 
                      position={[currentLocation.lat, currentLocation.lng]} 
                      icon={L.icon({ 
                        iconUrl: "data:image/svg+xml;base64," + btoa(`
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
                            <circle cx="12" cy="12" r="10" fill="#22c55e" stroke="#ffffff" stroke-width="3"/>
                            <circle cx="12" cy="12" r="4" fill="#ffffff"/>
                          </svg>
                        `),
                        iconSize: [32, 32] 
                      })}
                    >
                      <Popup>
                        <div>
                          <strong>Your Current Location</strong><br />
                          {isWithinCityBoundary(currentLocation.lat, currentLocation.lng) ? 
                            <span className="text-green-600">Within Ahmedabad</span> : 
                            <span className="text-red-600">Outside City Limits</span>
                          }
                        </div>
                      </Popup>
                    </Marker>
                    
                    {/* Start Station */}
                    <Marker 
                      position={[
                        startStation.coordinates?.latitude || startStation.location?.coordinates?.[1] || 0,
                        startStation.coordinates?.longitude || startStation.location?.coordinates?.[0] || 0
                      ]} 
                      icon={L.icon({ 
                        iconUrl: "data:image/svg+xml;base64," + btoa(`
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28">
                            <circle cx="12" cy="12" r="10" fill="#10b981" stroke="#ffffff" stroke-width="2"/>
                            <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">S</text>
                          </svg>
                        `),
                        iconSize: [28, 28] 
                      })}
                    >
                      <Popup>Start Station: {startStation.station_name}</Popup>
                    </Marker>
                    
                    {/* Nearby Stations */}
                    {nearbyStations.map((station) => {
                      const lat = station.coordinates?.latitude || station.location?.coordinates?.[1] || 0;
                      const lng = station.coordinates?.longitude || station.location?.coordinates?.[0] || 0;
                      const withinGeofence = checkGeofence(lat, lng);
                      
                      return (
                        <React.Fragment key={station.station_id}>
                          <Marker
                            position={[lat, lng]}
                            icon={L.icon({ 
                              iconUrl: "data:image/svg+xml;base64," + btoa(`
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                                  <circle cx="12" cy="12" r="10" fill="${withinGeofence ? '#f59e0b' : '#3b82f6'}" stroke="#ffffff" stroke-width="2"/>
                                  <text x="12" y="16" text-anchor="middle" fill="white" font-size="9" font-weight="bold">E</text>
                                </svg>
                              `),
                              iconSize: [24, 24] 
                            })}
                            eventHandlers={{ click: () => withinGeofence && handleEndRide(station) }}
                          >
                            <Popup>
                              <div>
                                <strong>{station.station_name}</strong><br />
                                {withinGeofence ? 
                                  <span className="text-green-600">Click to end ride here</span> : 
                                  <span className="text-gray-600">Move closer to end ride</span>
                                }
                              </div>
                            </Popup>
                          </Marker>
                          
                          {/* Geofence circle */}
                          <Circle
                            center={[lat, lng]}
                            radius={500}
                            color={withinGeofence ? "#f59e0b" : "#3b82f6"}
                            weight={2}
                            fillOpacity={0.1}
                            dashArray={withinGeofence ? "none" : "5, 5"}
                          />
                        </React.Fragment>
                      );
                    })}
                    
                    {/* Ride Path */}
                    {ridePath.length > 1 && (
                      <Polyline
                        positions={ridePath}
                        color="#22c55e"
                        weight={4}
                        opacity={0.8}
                      />
                    )}
                  </MapContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-evgreen mx-auto mb-4"></div>
                      <p>Loading your location...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* End Ride Stations */}
          <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700/50">
            <h2 className="text-xl font-bold mb-4">End Ride</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {nearbyStations.map((station) => {
                const lat = station.coordinates?.latitude || station.location?.coordinates?.[1] || 0;
                const lng = station.coordinates?.longitude || station.location?.coordinates?.[0] || 0;
                const withinGeofence = checkGeofence(lat, lng);
                const distance = calculateDistance(
                  currentLocation?.lat || 0, currentLocation?.lng || 0, lat, lng
                );
                
                return (
                  <div
                    key={station.station_id}
                    className={`p-4 rounded-lg border transition-all ${
                      withinGeofence
                        ? 'border-evgreen bg-evgreen/10 cursor-pointer hover:bg-evgreen/20'
                        : 'border-gray-600 bg-gray-700/50'
                    }`}
                    onClick={() => withinGeofence && handleEndRide(station)}
                  >
                    <h3 className="font-semibold">{station.station_name}</h3>
                    <p className="text-sm text-gray-400">{distance.toFixed(2)} km away</p>
                    <p className="text-sm text-gray-400">
                      Available: {station.available_ports || 'N/A'} ports
                    </p>
                    {withinGeofence ? (
                      <div className="mt-2 text-evgreen text-sm font-semibold">
                        Tap to end ride here
                      </div>
                    ) : (
                      <div className="mt-2 text-gray-500 text-sm">
                        Move closer to end ride
                      </div>
                    )}
                  </div>
                );
              })}
              
              {nearbyStations.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <div className="text-4xl mb-2">🔍</div>
                  <p>No stations found nearby</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveRide;
