import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Circle, Popup, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import API from "../api";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const navigate = useNavigate();

  // Ahmedabad City Boundary Coordinates (approximate polygon)
  const ahmedabadBoundary = [
    [23.13594, 72.50839],
    [23.26216,72.64022],
    [23.24260,72.67730],
    [23.15866,72.70271],
    [23.10689,72.69721],
    [22.93626,72.65121],
    [22.91982,72.53997],
    [22.93120,72.48229],
    [22.98462,72.44796],
    [23.13594, 72.50839] 
  ];

  // Check if a point is within Ahmedabad city boundary
  const isWithinCityBoundary = (lat, lng) => {
    // Simple point-in-polygon check (basic implementation)
    let inside = false;
    for (let i = 0, j = ahmedabadBoundary.length - 1; i < ahmedabadBoundary.length; j = i++) {
      if (((ahmedabadBoundary[i][0] > lat) !== (ahmedabadBoundary[j][0] > lat)) &&
          (lng < (ahmedabadBoundary[j][1] - ahmedabadBoundary[i][1]) * (lat - ahmedabadBoundary[i][0]) / (ahmedabadBoundary[j][0] - ahmedabadBoundary[i][0]) + ahmedabadBoundary[i][1])) {
        inside = !inside;
      }
    }
    return inside;
  };
  const [profile, setProfile] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyStations, setNearbyStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const watchIdRef = useRef(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
    }
    initializeDashboard();
    
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('theme', !darkMode ? 'dark' : 'light');
  };

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch profile
      const profileRes = await API.get("/profile");
      setProfile(profileRes.data.customer);

      // Fetch wallet balance
      const walletRes = await API.get("/wallet/balance");
      setWalletBalance(walletRes.data.wallet_balance);

      // Get user location and nearby stations
      getCurrentLocation();

    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser");
      fetchDefaultStations();
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        setUserLocation(newLocation);
        fetchNearbyStations(newLocation.lat, newLocation.lng);
        
        // Start watching position for real-time updates
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const updatedLocation = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy
            };
            setUserLocation(updatedLocation);
            
            // Update stations if user moves significantly
            const distance = calculateDistance(
              newLocation.lat, newLocation.lng,
              updatedLocation.lat, updatedLocation.lng
            );
            if (distance > 0.1) { // 100 meters
              fetchNearbyStations(updatedLocation.lat, updatedLocation.lng);
            }
          },
          (error) => console.warn("Location tracking error:", error),
          options
        );
      },
      (error) => {
        console.error("Geolocation error:", error);
        // Fallback to Ahmedabad center
        const defaultLocation = { lat: 23.0225, lng: 72.5714 };
        setUserLocation(defaultLocation);
        fetchNearbyStations(defaultLocation.lat, defaultLocation.lng);
      },
      options
    );
  };

  const fetchDefaultStations = async () => {
    try {
      const response = await API.get("/stations/nearby?lat=23.0225&lng=72.5714");
      setNearbyStations(response.data.stations || []);
    } catch (err) {
      console.error("Error fetching default stations:", err);
    }
  };

  const fetchNearbyStations = async (lat, lng) => {
    try {
      const response = await API.get(`/stations/nearby?lat=${lat}&lng=${lng}`);
      const stationsWithDistance = response.data.stations?.map(station => {
        const stationLat = station.coordinates?.latitude || station.location?.coordinates?.[1] || 0;
        const stationLng = station.coordinates?.longitude || station.location?.coordinates?.[0] || 0;
        const distance = calculateDistance(lat, lng, stationLat, stationLng);
        return { ...station, distance };
      }).sort((a, b) => a.distance - b.distance) || [];
      
      setNearbyStations(stationsWithDistance);
    } catch (err) {
      console.error("Error fetching nearby stations:", err);
      setError("Failed to fetch nearby stations");
    }
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const checkGeofence = (stationLat, stationLng) => {
    if (!userLocation) return false;
    const distance = calculateDistance(
      userLocation.lat, userLocation.lng,
      stationLat, stationLng
    );
    return distance <= 0.5; // 500 meters geofence
  };

  const handleStationSelect = (station) => {
    setSelectedStation(station);
  };

  const handleStartRide = async (station) => {
    // Check wallet balance
    if (walletBalance < 10) {
      setError("Insufficient wallet balance. Minimum ₹10 required.");
      return;
    }

    // Check geofence
    const stationLat = station.coordinates?.latitude || station.location?.coordinates?.[1] || 0;
    const stationLng = station.coordinates?.longitude || station.location?.coordinates?.[0] || 0;
    
    if (!checkGeofence(stationLat, stationLng)) {
      setError("You must be within 500 meters of the station to start a ride.");
      return;
    }

    // Navigate to unlock vehicle page
    navigate('/unlock-vehicle', { 
      state: { 
        selectedStation: station,
        userLocation: userLocation 
      } 
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('customer_id');
    navigate('/login');
  };

  const themeClasses = darkMode
    ? "min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white"
    : "min-h-screen bg-gradient-to-br from-white via-gray-50 to-evgreen/5 text-gray-800";

  const cardClasses = darkMode
    ? "bg-gray-800/80 backdrop-blur-sm border border-gray-700/50"
    : "bg-white/80 backdrop-blur-sm border border-evgreen/10 shadow-lg";

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${darkMode ? 'bg-black text-white' : 'bg-white text-gray-800'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-evgreen/20 border-t-evgreen mx-auto mb-6"></div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-evgreen">Loading Dashboard</div>
            <div className="text-sm opacity-60">Fetching your ride data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !userLocation) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${darkMode ? 'bg-black text-white' : 'bg-white text-gray-800'}`}>
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-xl font-semibold text-red-500 mb-2">Oops! Something went wrong</div>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={initializeDashboard}
            className="bg-evgreen hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={themeClasses}>
      <Navbar 
        profile={profile} 
        walletBalance={walletBalance} 
        onLogout={handleLogout} 
      />
      
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-evgreen rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-black mb-2">
              <span className={darkMode ? "text-white" : "text-gray-800"}>Welcome, </span>
              <span className="text-evgreen">{profile?.customer_name}!</span>
            </h1>
            <p className={`text-lg ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Find nearby stations and start your eco-friendly ride
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className={`p-3 rounded-xl transition-all duration-300 ${darkMode
                  ? "bg-yellow-500 text-black hover:bg-yellow-400"
                  : "bg-gray-800 text-white hover:bg-gray-700"
                }`}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-300">{error}</span>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className={`${cardClasses} rounded-2xl p-6 h-[600px]`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Live Map - Ahmedabad</h2>
                <div className="flex items-center text-sm text-evgreen">
                  <div className="w-3 h-3 bg-evgreen rounded-full animate-pulse mr-2"></div>
                  Live Tracking
                </div>
              </div>
              
              {/* Real Map with react-leaflet */}
              <div className="h-[520px] rounded-xl overflow-hidden border-2 border-evgreen">
                {userLocation ? (
                  <MapContainer
                    center={[userLocation.lat, userLocation.lng]}
                    zoom={14}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution="&copy; OpenStreetMap contributors"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {/* User Marker */}
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={L.icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png", iconSize: [32, 32] })}>
                      <Popup>
                        <div>
                          <strong>📍 Your Location</strong><br />
                          Lat: {userLocation.lat.toFixed(6)}<br />
                          Lng: {userLocation.lng.toFixed(6)}<br />
                          Accuracy: ±{Math.round(userLocation.accuracy || 0)}m<br />
                          {isWithinCityBoundary(userLocation.lat, userLocation.lng) ? 
                            <span className="text-green-600">✅ Within Ahmedabad</span> : 
                            <span className="text-red-600">❌ Outside City Limits</span>
                          }
                        </div>
                      </Popup>
                    </Marker>
                    
                    {/* Ahmedabad City Boundary Polygon */}
                    <Polygon 
                      positions={ahmedabadBoundary} 
                      color="#22c55e" 
                      weight={3}
                      fillColor="#22c55e" 
                      fillOpacity={0.1}
                      dashArray="5, 10"
                    >
                      <Popup>
                        <div>
                          <strong>🏙️ Ahmedabad City Boundary</strong><br />
                          Total Area: ~1,866 km²<br />
                          Population: ~8.4 Million<br />
                          <span className="text-green-600">✅ Ride Zone Active</span>
                        </div>
                      </Popup>
                    </Polygon>
                    {/* Station Markers and Geofencing */}
                    {nearbyStations.map((station) => {
                      const lat = station.coordinates?.latitude || station.location?.coordinates?.[1] || 0;
                      const lng = station.coordinates?.longitude || station.location?.coordinates?.[0] || 0;
                      const withinCity = isWithinCityBoundary(lat, lng);
                      const withinGeofence = checkGeofence(lat, lng);
                      const isSelected = selectedStation?.station_id === station.station_id;
                      
                      // Create custom colored markers using data URIs
                      let iconUrl, iconSize;
                      if (isSelected) {
                        // Orange/Red marker for selected station
                        iconUrl = "data:image/svg+xml;base64," + btoa(`
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
                            <circle cx="12" cy="12" r="10" fill="#ff4444" stroke="#ffffff" stroke-width="2"/>
                            <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">S</text>
                          </svg>
                        `);
                        iconSize = [32, 32];
                      } else if (withinGeofence) {
                        // Green marker for available station
                        iconUrl = "data:image/svg+xml;base64," + btoa(`
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28">
                            <circle cx="12" cy="12" r="10" fill="#22c55e" stroke="#ffffff" stroke-width="2"/>
                            <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">B</text>
                          </svg>
                        `);
                        iconSize = [28, 28];
                      } else {
                        // Blue marker for regular station
                        iconUrl = "data:image/svg+xml;base64," + btoa(`
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                            <circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
                            <text x="12" y="16" text-anchor="middle" fill="white" font-size="9" font-weight="bold">B</text>
                          </svg>
                        `);
                        iconSize = [24, 24];
                      }
                      
                      return (
                        <Marker
                          key={station.station_id}
                          position={[lat, lng]}
                          icon={L.icon({ 
                            iconUrl: iconUrl,
                            iconSize: iconSize,
                            iconAnchor: [iconSize[0]/2, iconSize[1]/2],
                            popupAnchor: [0, -iconSize[1]/2]
                          })}
                          eventHandlers={{ click: () => handleStationSelect(station) }}
                        >
                          <Popup>
                            <div>
                              <strong>{station.station_name}</strong><br />
                              Distance: {station.distance?.toFixed(2)} km<br />
                              Available Bikes: {station.available_bikes || 'N/A'}<br />
                              Available Ports: {station.available_ports || 'N/A'}<br />
                              {withinCity ? 
                                <span className="text-green-600">Within City</span> : 
                                <span className="text-red-600">Outside City</span>
                              }<br />
                              {withinGeofence ? 
                                <span className="text-green-600">In Range (500m)</span> : 
                                <span className="text-orange-600">{Math.round(station.distance * 1000)}m away</span>
                              }
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                    {/* Geofencing Circles for Stations */}
                    {nearbyStations.map((station) => {
                      const lat = station.coordinates?.latitude || station.location?.coordinates?.[1] || 0;
                      const lng = station.coordinates?.longitude || station.location?.coordinates?.[0] || 0;
                      const isSelected = selectedStation?.station_id === station.station_id;
                      const withinGeofence = checkGeofence(lat, lng);
                      
                      // Color scheme to match station icons
                      let circleColor, fillColor, opacity, weight;
                      if (isSelected) {
                        circleColor = "#ff6b35"; // Orange for selected
                        fillColor = "#ff6b35";
                        opacity = 0.3;
                        weight = 4;
                      } else if (withinGeofence) {
                        circleColor = "#10b981"; // Green for available
                        fillColor = "#10b981";
                        opacity = 0.2;
                        weight = 3;
                      } else {
                        circleColor = "#3b82f6"; // Blue for regular
                        fillColor = "#3b82f6";
                        opacity = 0.15;
                        weight = 2;
                      }
                      
                      return (
                        <Circle
                          key={station.station_id + "-circle"}
                          center={[lat, lng]}
                          radius={500}
                          color={circleColor}
                          weight={weight}
                          fillColor={fillColor}
                          fillOpacity={opacity}
                          dashArray={withinGeofence ? "none" : "8, 4"}
                        >
                          <Popup>
                            <div>
                              <strong>Geofence Zone</strong><br />
                              Station: {station.station_name}<br />
                              Radius: 500 meters<br />
                              {withinGeofence ? 
                                <span className="text-green-600">You can start ride here</span> : 
                                <span className="text-blue-600">Move closer to start ride</span>
                              }
                            </div>
                          </Popup>
                        </Circle>
                      );
                    })}
                  </MapContainer>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-900">
                    <div className="text-center text-gray-400">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-evgreen mx-auto mb-4"></div>
                      <p className="text-lg font-medium">Loading your location...</p>
                      <p className="text-sm mt-2">Please enable GPS for best experience</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Station Details & Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className={`${cardClasses} rounded-2xl p-6`}>
              <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link 
                  to="/wallet"
                  className="block w-full bg-evgreen hover:bg-green-600 text-black px-4 py-3 rounded-xl font-semibold text-center transition-all duration-300 hover:scale-105"
                >
                  💳 Add Money
                </Link>
                <Link 
                  to="/rides"
                  className="block w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold text-center transition-all duration-300 hover:scale-105"
                >
                  📊 Ride History
                </Link>
                <Link 
                  to="/buy-passes"
                  className="block w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-xl font-semibold text-center transition-all duration-300 hover:scale-105"
                >
                  🎟️ Buy Passes
                </Link>
              </div>
            </div>

            {/* Selected Station Details */}
            {selectedStation ? (
              <div className={`${cardClasses} rounded-2xl p-6 border-2 border-evgreen`}>
                <h3 className="text-xl font-bold text-evgreen mb-4">Selected Station</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-bold text-lg">{selectedStation.station_name}</h4>
                    <p className="text-sm opacity-75">📍 {selectedStation.station_area}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <div className="text-2xl text-evgreen">🚲</div>
                      <div className="text-sm">Capacity</div>
                      <div className="font-bold">{selectedStation.capacity}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl text-blue-400">⚡</div>
                      <div className="text-sm">Charging</div>
                      <div className="font-bold">{selectedStation.charging_ports}</div>
                    </div>
                  </div>

                  {selectedStation.distance !== undefined && (
                    <div className="text-center py-2 bg-evgreen/10 rounded-lg">
                      <div className="text-evgreen font-bold">
                        🎯 {selectedStation.distance.toFixed(2)} km away
                      </div>
                      <div className="text-xs opacity-75">
                        {selectedStation.distance <= 0.5 ? "Within range ✅" : "Move closer to unlock 🚶‍♂️"}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleStartRide(selectedStation)}
                    disabled={
                      walletBalance < 10 || 
                      !checkGeofence(
                        selectedStation.coordinates?.latitude || selectedStation.location?.coordinates?.[1] || 0,
                        selectedStation.coordinates?.longitude || selectedStation.location?.coordinates?.[0] || 0
                      )
                    }
                    className={`w-full py-3 rounded-xl font-bold transition-all duration-300 ${
                      walletBalance >= 10 && checkGeofence(
                        selectedStation.coordinates?.latitude || selectedStation.location?.coordinates?.[1] || 0,
                        selectedStation.coordinates?.longitude || selectedStation.location?.coordinates?.[0] || 0
                      )
                        ? 'bg-gradient-to-r from-evgreen to-green-400 text-black hover:scale-105 shadow-lg'
                        : 'bg-gray-500/50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {walletBalance < 10 
                      ? 'Insufficient Balance' 
                      : !checkGeofence(
                          selectedStation.coordinates?.latitude || selectedStation.location?.coordinates?.[1] || 0,
                          selectedStation.coordinates?.longitude || selectedStation.location?.coordinates?.[0] || 0
                        )
                        ? 'Move Closer to Unlock'
                        : 'Unlock Vehicle'
                    }
                  </button>
                </div>
              </div>
            ) : (
              <div className={`${cardClasses} rounded-2xl p-6 text-center`}>
                <div className="text-6xl mb-4">🗺️</div>
                <h3 className="text-xl font-bold mb-2">Select a Station</h3>
                <p className="text-sm opacity-75">
                  Click on a station marker on the map to see details and start your ride
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Nearby Stations List */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6">
            Nearby Stations ({nearbyStations.length}) - Sorted by Distance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nearbyStations.map((station, index) => {
              const isInRange = checkGeofence(
                station.coordinates?.latitude || station.location?.coordinates?.[1] || 0,
                station.coordinates?.longitude || station.location?.coordinates?.[0] || 0
              );
              
              return (
                <div
                  key={station.station_id}
                  className={`${cardClasses} rounded-xl p-4 cursor-pointer transition-all duration-300 hover:scale-105 ${
                    selectedStation?.station_id === station.station_id 
                      ? 'ring-2 ring-evgreen border-evgreen' 
                      : ''
                  }`}
                  onClick={() => handleStationSelect(station)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold">{station.station_name}</h4>
                      <p className="text-xs opacity-75">{station.station_area}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                      isInRange ? 'bg-evgreen/20 text-evgreen' : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      #{index + 1}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm space-y-1">
                      <div>🚲 Capacity: {station.capacity}</div>
                      <div>⚡ Charging: {station.charging_ports}</div>
                    </div>
                    {station.distance !== undefined && (
                      <div className="text-right">
                        <div className="font-bold text-evgreen">
                          {station.distance.toFixed(2)} km
                        </div>
                        <div className="text-xs opacity-75">
                          {isInRange ? '✅ In Range' : '🚶‍♂️ Walk closer'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {nearbyStations.length === 0 && !loading && (
            <div className={`${cardClasses} rounded-xl p-8 text-center`}>
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold mb-2">No Stations Found</h3>
              <p className="opacity-75 mb-6">
                We couldn't find any stations in your area. Please ensure location access is enabled.
              </p>
              <button
                onClick={getCurrentLocation}
                className="bg-evgreen hover:bg-green-600 text-black px-6 py-3 rounded-xl font-semibold"
              >
                🔄 Refresh Location
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
