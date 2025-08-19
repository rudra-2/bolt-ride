import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyStations, setNearbyStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const mapRef = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    // Check for saved theme preference
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

    // Get initial position
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

    // Navigate to QR scanning
    navigate('/stations', { 
      state: { 
        selectedStation: station,
        userLocation: userLocation 
      } 
    });
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

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${darkMode ? 'bg-black text-white' : 'bg-white text-gray-800'}`}>
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-xl font-semibold text-red-500 mb-2">Oops! Something went wrong</div>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={fetchDashboardData}
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
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-evgreen rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-evgreen/30 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header with theme toggle */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-black mb-2">
              <span className={darkMode ? "text-white" : "text-gray-800"}>Welcome back, </span>
              <span className="text-evgreen">{profile?.customer_name}!</span>
              <span className="ml-2">👋</span>
            </h1>
            <p className={`text-xl ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Ready for your next eco-friendly adventure?
            </p>
          </div>
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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Wallet Balance */}
          <div className={`${cardClasses} rounded-2xl p-6 group hover:scale-105 transform transition-all duration-300 hover:shadow-2xl hover:shadow-evgreen/10`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-lg font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Wallet Balance
                </h3>
                <p className="text-4xl font-black text-evgreen">₹{walletBalance}</p>
              </div>
              <div className="text-5xl text-evgreen group-hover:scale-110 transition-transform">💳</div>
            </div>
            <Link
              to="/wallet"
              className="inline-flex items-center bg-evgreen hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 group-hover:translate-x-1"
            >
              Add Money
              <span className="ml-2">→</span>
            </Link>
          </div>

          {/* Total Rides */}
          <div className={`${cardClasses} rounded-2xl p-6 group hover:scale-105 transform transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-lg font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Total Rides
                </h3>
                <p className="text-4xl font-black text-blue-500">{recentRides.length}</p>
              </div>
              <div className="text-5xl text-blue-500 group-hover:scale-110 transition-transform">🚴‍♂️</div>
            </div>
            <Link
              to="/rides"
              className="inline-flex items-center bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 group-hover:translate-x-1"
            >
              View History
              <span className="ml-2">→</span>
            </Link>
          </div>

          {/* Profile Info */}
          <div className={`${cardClasses} rounded-2xl p-6 group hover:scale-105 transform transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-lg font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Account
                </h3>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {profile?.email}
                </p>
                <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                  ID: {profile?.customer_id}
                </p>
              </div>
              <div className="text-5xl text-purple-500 group-hover:scale-110 transition-transform">👤</div>
            </div>
            <button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105">
              Edit Profile
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-3xl font-black">Quick Actions</h2>
            <div className="flex-1 h-1 bg-gradient-to-r from-evgreen to-transparent rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              to="/stations"
              className="group bg-gradient-to-br from-evgreen to-green-600 hover:from-green-600 hover:to-evgreen rounded-2xl p-6 text-center text-white transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-evgreen/25"
            >
              <div className="text-4xl mb-3 group-hover:animate-bounce">🗺️</div>
              <h3 className="font-bold text-lg">Find Stations</h3>
              <p className="text-sm opacity-90 mt-1">Locate nearby bikes</p>
            </Link>
            <Link
              to="/rides"
              className="group bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-500 rounded-2xl p-6 text-center text-white transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-blue-500/25"
            >
              <div className="text-4xl mb-3 group-hover:animate-bounce">📊</div>
              <h3 className="font-bold text-lg">Ride History</h3>
              <p className="text-sm opacity-90 mt-1">View past rides</p>
            </Link>
            <Link
              to="/wallet"
              className="group bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-500 rounded-2xl p-6 text-center text-white transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-purple-500/25"
            >
              <div className="text-4xl mb-3 group-hover:animate-bounce">💰</div>
              <h3 className="font-bold text-lg">Manage Wallet</h3>
              <p className="text-sm opacity-90 mt-1">Add funds</p>
            </Link>
            <Link
              to="/buy-passes"
              className="group bg-gradient-to-br from-yellow-500 to-orange-500 hover:from-orange-500 hover:to-yellow-500 rounded-2xl p-6 text-center text-white transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-yellow-500/25"
            >
              <div className="text-4xl mb-3 group-hover:animate-bounce">🎟️</div>
              <h3 className="font-bold text-lg">Buy Passes</h3>
              <p className="text-sm opacity-90 mt-1">Get ride passes</p>
            </Link>
          </div>
        </div>

        {/* Nearby Stations */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-3xl font-black">Nearby Stations</h2>
            <div className="flex-1 h-1 bg-gradient-to-r from-blue-500 to-transparent rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {nearbyStations.map((station, index) => (
              <div key={station.station_id} className={`${cardClasses} rounded-2xl p-6 group hover:scale-105 transform transition-all duration-300 hover:shadow-2xl hover:shadow-evgreen/10`} style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-xl text-evgreen group-hover:text-green-600 transition-colors">
                    {station.station_name}
                  </h3>
                  <div className="text-2xl text-evgreen group-hover:scale-110 transition-transform">📍</div>
                </div>
                <div className="space-y-2 mb-4">
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} flex items-center gap-2`}>
                    <span>🏢</span> {station.station_area}
                  </p>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} flex items-center gap-2`}>
                    <span>🚲</span> Capacity: {station.capacity} bikes
                  </p>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} flex items-center gap-2`}>
                    <span>⚡</span> Charging: {station.charging_ports} ports
                  </p>
                  {station.distance && (
                    <p className="text-sm text-evgreen font-semibold flex items-center gap-2">
                      <span>�</span> {station.distance.toFixed(2)} km away
                    </p>
                  )}
                </div>
                <Link
                  to="/stations"
                  className="inline-flex items-center bg-evgreen hover:bg-green-600 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 group-hover:translate-x-1"
                >
                  View Details
                  <span className="ml-2">→</span>
                </Link>
              </div>
            ))}
          </div>
          {nearbyStations.length === 0 && (
            <div className={`${cardClasses} rounded-2xl p-8 text-center`}>
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold mb-2">No stations found nearby</h3>
              <p className={`${darkMode ? "text-gray-400" : "text-gray-600"} mb-6`}>
                We couldn't locate any stations in your area. Try refreshing or check back later.
              </p>
              <button
                onClick={fetchDashboardData}
                className="bg-evgreen hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transform hover:scale-105 transition-all duration-300"
              >
                Refresh Location
              </button>
            </div>
          )}
        </div>

        {/* Recent Rides */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-3xl font-black">Recent Rides</h2>
            <div className="flex-1 h-1 bg-gradient-to-r from-purple-500 to-transparent rounded-full"></div>
          </div>
          <div className={`${cardClasses} rounded-2xl overflow-hidden`}>
            {recentRides.length > 0 ? (
              <div className="divide-y divide-gray-200/20">
                {recentRides.map((ride, index) => (
                  <div key={ride.ride_id} className="p-6 hover:bg-evgreen/5 transition-all duration-300 group" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ride.status === 'completed'
                              ? 'bg-evgreen/20 text-evgreen'
                              : ride.status === 'ongoing'
                                ? 'bg-blue-500/20 text-blue-600'
                                : 'bg-gray-500/20 text-gray-600'
                            }`}>
                            {ride.status.toUpperCase()}
                          </span>
                          <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {new Date(ride.start_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="font-semibold text-lg mb-1">Ride #{ride.ride_id}</p>
                            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                              Vehicle: {ride.vehicle_id}
                            </p>
                            {ride.distance && (
                              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                Distance: {ride.distance} km
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {ride.fare_collected && (
                          <p className="text-2xl font-black text-evgreen mb-1">
                            ₹{ride.fare_collected}
                          </p>
                        )}
                        {ride.total_time && (
                          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                            {ride.total_time} minutes
                          </p>
                        )}
                        <div className="mt-2">
                          <Link
                            to="/rides"
                            className="text-evgreen hover:text-green-600 text-sm font-semibold group-hover:translate-x-1 transition-all duration-300 inline-flex items-center"
                          >
                            View Details →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-8xl mb-6">🚴‍♂️</div>
                <h3 className="text-2xl font-bold mb-3">No rides yet</h3>
                <p className={`${darkMode ? "text-gray-400" : "text-gray-600"} mb-8 text-lg`}>
                  Start your first eco-friendly adventure today!
                </p>
                <Link
                  to="/stations"
                  className="inline-flex items-center bg-gradient-to-r from-evgreen to-green-600 hover:from-green-600 hover:to-evgreen text-white px-8 py-4 rounded-xl font-bold text-lg transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-evgreen/25"
                >
                  Start Your First Ride
                  <span className="ml-2">🚀</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
