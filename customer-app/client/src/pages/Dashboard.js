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
  // Use global theme from localStorage and document.documentElement.classList
  const watchIdRef = useRef(null);

  useEffect(() => {
    initializeDashboard();
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // No local darkMode toggler; theme is managed globally by Navbar

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

  const isDarkMode = document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
  const themeClasses = isDarkMode
    ? "min-h-screen bg-gradient-to-br from-[#14452F] via-[#0A1A2F] to-[#09111A] text-white"
    : "min-h-screen bg-gradient-to-br from-[#eafaf1] via-[#f5fdf8] to-[#d6f5e6] text-gray-900";

  const cardClasses = isDarkMode
    ? "bg-[#1E293B] border-2 border-[#09111A] shadow-lg backdrop-blur-md text-white"
    : "bg-[#F3F4F6] border-2 border-[#1E293B] shadow-lg backdrop-blur-md text-[#0A1A2F]";

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-[#101c16] text-white' : 'bg-[#eafaf1] text-gray-900'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#22c55e]/30 border-t-[#22c55e] mx-auto mb-6"></div>
          <div className="space-y-2">
            <div className="text-2xl font-extrabold text-[#22c55e] tracking-wide">Loading Dashboard</div>
            <div className="text-sm opacity-60">Fetching your ride data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !userLocation) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-[#101c16] text-white' : 'bg-[#eafaf1] text-gray-900'}`}>
        <div className="text-center space-y-4">
          <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" stroke="#22c55e" strokeWidth="4" fill="#fff" /><path d="M24 16v10" stroke="#22c55e" strokeWidth="3" strokeLinecap="round"/><circle cx="24" cy="32" r="2" fill="#22c55e"/></svg>
          <div className="text-xl font-semibold text-[#22c55e] mb-2">Something went wrong</div>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={initializeDashboard}
            className="bg-[#22c55e] hover:bg-[#10b981] text-white px-6 py-3 rounded-xl font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg"
          >
            Retry
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

      {/* Background decoration - subtle gradients and shapes */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-24 left-16 w-96 h-96 bg-[#22c55e]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-24 right-16 w-[32rem] h-[32rem] bg-[#3b82f6]/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">
              <span className={isDarkMode ? "text-white" : "text-gray-900"}>Welcome, </span>
              <span className="text-[#22c55e]">{profile?.customer_name}</span>
            </h1>
            <p className={`text-lg ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              Find nearby stations and start your electric journey
            </p>
          </div>
    {/* ...existing code... (no theme toggler here, only in Navbar) */}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2">
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" stroke="#ef4444" strokeWidth="2" fill="#fff"/><path d="M10 6v5" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/><circle cx="10" cy="14" r="1" fill="#ef4444"/></svg>
              <span className="text-[#ef4444] font-semibold">{error}</span>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className={`${cardClasses} rounded-2xl p-8 h-[650px] shadow-xl`}> 
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Ahmedabad EV Map</h2>
                <div className="flex items-center text-sm text-[#22c55e] gap-2">
                  <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" stroke="#22c55e" strokeWidth="2" fill="#22c55e"/></svg>
                  Live Tracking
                </div>
              </div>
              <div className="h-[520px] rounded-xl overflow-hidden border-2 border-[#22c55e]/60 shadow-lg">
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
                    {/* User Marker - unique SVG */}
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={L.icon({ iconUrl: "data:image/svg+xml;base64," + btoa(`
                      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32'>
                        <circle cx='16' cy='16' r='14' fill='#22c55e' stroke='#fff' stroke-width='3'/>
                        <circle cx='16' cy='16' r='6' fill='#fff'/>
                        <text x='16' y='30' text-anchor='middle' fill='#22c55e' font-size='8' font-weight='bold'>YOU</text>
                      </svg>
                    `), iconSize: [32, 32] })}>
                      <Popup>
                        <div>
                          <strong>Your Location</strong><br />
                          Lat: {userLocation.lat.toFixed(6)}<br />
                          Lng: {userLocation.lng.toFixed(6)}<br />
                          Accuracy: ±{Math.round(userLocation.accuracy || 0)}m<br />
                          {isWithinCityBoundary(userLocation.lat, userLocation.lng) ? 
                            <span className="text-[#22c55e] font-semibold">Within Ahmedabad</span> : 
                            <span className="text-[#ef4444] font-semibold">Outside City Limits</span>
                          }
                        </div>
                      </Popup>
                    </Marker>
                    {/* Ahmedabad City Boundary Polygon - unique style */}
                    <Polygon 
                      positions={ahmedabadBoundary} 
                      color="#22c55e" 
                      weight={3}
                      fillColor="#22c55e" 
                      fillOpacity={0.08}
                      dashArray="6, 12"
                    >
                      <Popup>
                        <div>
                          <strong>Ahmedabad City Boundary</strong><br />
                          <span className="text-[#22c55e]">EV Service Area</span>
                        </div>
                      </Popup>
                    </Polygon>
                    {/* Station Markers and Geofencing - unique SVGs */}
                    {nearbyStations.map((station) => {
                      const lat = station.coordinates?.latitude || station.location?.coordinates?.[1] || 0;
                      const lng = station.coordinates?.longitude || station.location?.coordinates?.[0] || 0;
                      const withinCity = isWithinCityBoundary(lat, lng);
                      const withinGeofence = checkGeofence(lat, lng);
                      const isSelected = selectedStation?.station_id === station.station_id;
                      // Custom SVG icons
                      let iconUrl, iconSize;
                      if (isSelected) {
                        iconUrl = "data:image/svg+xml;base64," + btoa(`
                          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32'>
                            <circle cx='16' cy='16' r='14' fill='#3b82f6' stroke='#fff' stroke-width='3'/>
                            <text x='16' y='22' text-anchor='middle' fill='white' font-size='12' font-weight='bold'>S</text>
                          </svg>
                        `);
                        iconSize = [32, 32];
                      } else if (withinGeofence) {
                        iconUrl = "data:image/svg+xml;base64," + btoa(`
                          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 28' width='28' height='28'>
                            <circle cx='14' cy='14' r='12' fill='#22c55e' stroke='#fff' stroke-width='2'/>
                            <text x='14' y='20' text-anchor='middle' fill='white' font-size='10' font-weight='bold'>B</text>
                          </svg>
                        `);
                        iconSize = [28, 28];
                      } else {
                        iconUrl = "data:image/svg+xml;base64," + btoa(`
                          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'>
                            <circle cx='12' cy='12' r='10' fill='#3b82f6' stroke='#fff' stroke-width='2'/>
                            <text x='12' y='16' text-anchor='middle' fill='white' font-size='9' font-weight='bold'>B</text>
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
                                <span className="text-[#22c55e]">Within City</span> : 
                                <span className="text-[#ef4444]">Outside City</span>
                              }<br />
                              {withinGeofence ? 
                                <span className="text-[#22c55e]">In Range (500m)</span> : 
                                <span className="text-[#3b82f6]">{Math.round(station.distance * 1000)}m away</span>
                              }
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                    {/* Geofencing Circles for Stations - unique style */}
                    {nearbyStations.map((station) => {
                      const lat = station.coordinates?.latitude || station.location?.coordinates?.[1] || 0;
                      const lng = station.coordinates?.longitude || station.location?.coordinates?.[0] || 0;
                      const isSelected = selectedStation?.station_id === station.station_id;
                      const withinGeofence = checkGeofence(lat, lng);
                      let circleColor, fillColor, opacity, weight;
                      if (isSelected) {
                        circleColor = "#3b82f6";
                        fillColor = "#3b82f6";
                        opacity = 0.2;
                        weight = 4;
                      } else if (withinGeofence) {
                        circleColor = "#22c55e";
                        fillColor = "#22c55e";
                        opacity = 0.15;
                        weight = 3;
                      } else {
                        circleColor = "#d1d5db";
                        fillColor = "#d1d5db";
                        opacity = 0.08;
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
                                <span className="text-[#22c55e]">You can start ride here</span> : 
                                <span className="text-[#3b82f6]">Move closer to start ride</span>
                              }
                            </div>
                          </Popup>
                        </Circle>
                      );
                    })}
                  </MapContainer>
                ) : (
                  <div className="flex items-center justify-center h-full bg-[#101c16]">
                    <div className="text-center text-[#22c55e]">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#22c55e] mx-auto mb-4"></div>
                      <p className="text-lg font-medium">Loading your location...</p>
                      <p className="text-sm mt-2">Please enable GPS for best experience</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Station Details & Actions */}
          <div className="space-y-8">
            {/* Quick Actions - unique icons, no emojis */}
            <div className={`${cardClasses} rounded-2xl p-8 shadow-xl`}>
              <h3 className="text-xl font-bold mb-6 tracking-tight">Quick Actions</h3>
              <div className="space-y-4">
                <Link 
                  to="/wallet"
                  className="block w-full bg-gradient-to-r from-[#22c55e] to-[#10b981] text-white px-4 py-3 rounded-xl font-semibold text-center transition-all duration-300 hover:scale-105 shadow-md"
                >
                  <span className="inline-block align-middle mr-2"><svg width="20" height="20" fill="none" viewBox="0 0 20 20"><rect x="2" y="5" width="16" height="10" rx="3" fill="#22c55e"/><rect x="6" y="9" width="8" height="2" rx="1" fill="#fff"/></svg></span>
                  Add Money
                </Link>
                <Link 
                  to="/rides"
                  className="block w-full bg-gradient-to-r from-[#3b82f6] to-[#22c55e] text-white px-4 py-3 rounded-xl font-semibold text-center transition-all duration-300 hover:scale-105 shadow-md"
                >
                  <span className="inline-block align-middle mr-2"><svg width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="#3b82f6"/><path d="M6 10h8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg></span>
                  Ride History
                </Link>
                <Link 
                  to="/buy-passes"
                  className="block w-full bg-gradient-to-r from-[#a78bfa] to-[#22c55e] text-white px-4 py-3 rounded-xl font-semibold text-center transition-all duration-300 hover:scale-105 shadow-md"
                >
                  <span className="inline-block align-middle mr-2"><svg width="20" height="20" fill="none" viewBox="0 0 20 20"><rect x="4" y="6" width="12" height="8" rx="2" fill="#a78bfa"/><rect x="8" y="10" width="4" height="2" rx="1" fill="#fff"/></svg></span>
                  Buy Passes
                </Link>
              </div>
            </div>

            {/* Selected Station Details - unique icons, no emojis */}
            {selectedStation ? (
              <div className={`${cardClasses} rounded-2xl p-8 border-2 border-[#22c55e] shadow-xl`}>
                <h3 className="text-xl font-bold text-[#22c55e] mb-6 tracking-tight">Selected Station</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-lg">{selectedStation.station_name}</h4>
                    <p className="text-sm opacity-75 text-[#3b82f6]">{selectedStation.station_area}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <span className="inline-block mb-2"><svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="4" y="8" width="16" height="8" rx="4" fill="#22c55e"/><rect x="10" y="12" width="4" height="2" rx="1" fill="#fff"/></svg></span>
                      <div className="text-sm">Capacity</div>
                      <div className="font-bold">{selectedStation.capacity}</div>
                    </div>
                    <div className="text-center">
                      <span className="inline-block mb-2"><svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="6" y="10" width="12" height="4" rx="2" fill="#3b82f6"/><rect x="11" y="12" width="2" height="2" rx="1" fill="#fff"/></svg></span>
                      <div className="text-sm">Charging</div>
                      <div className="font-bold">{selectedStation.charging_ports}</div>
                    </div>
                  </div>
                  {selectedStation.distance !== undefined && (
                    <div className="text-center py-2 bg-[#22c55e]/10 rounded-lg">
                      <div className="text-[#22c55e] font-bold">
                        {selectedStation.distance.toFixed(2)} km away
                      </div>
                      <div className="text-xs opacity-75">
                        {selectedStation.distance <= 0.5 ? "Within range" : "Move closer to unlock"}
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
                        ? 'bg-gradient-to-r from-[#22c55e] to-[#10b981] text-white hover:scale-105 shadow-lg'
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
              <div className={`${cardClasses} rounded-2xl p-8 text-center shadow-xl`}>
                <span className="inline-block mb-4"><svg width="48" height="48" fill="none" viewBox="0 0 48 48"><rect x="8" y="16" width="32" height="16" rx="8" fill="#22c55e"/><rect x="20" y="24" width="8" height="4" rx="2" fill="#fff"/></svg></span>
                <h3 className="text-xl font-bold mb-2">Select a Station</h3>
                <p className="text-sm opacity-75">
                  Click on a station marker on the map to see details and start your ride
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Nearby Stations List - unique icons, no emojis */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-8 tracking-tight">
            Nearby Stations ({nearbyStations.length}) - Sorted by Distance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nearbyStations.map((station, index) => {
              const isInRange = checkGeofence(
                station.coordinates?.latitude || station.location?.coordinates?.[1] || 0,
                station.coordinates?.longitude || station.location?.coordinates?.[0] || 0
              );
              return (
                <div
                  key={station.station_id}
                  className={`${cardClasses} rounded-xl p-6 cursor-pointer transition-all duration-300 hover:scale-105 shadow-md ${
                    selectedStation?.station_id === station.station_id 
                      ? 'ring-2 ring-[#22c55e] border-[#22c55e]' 
                      : ''
                  }`}
                  onClick={() => handleStationSelect(station)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-lg">{station.station_name}</h4>
                      <p className="text-xs opacity-75 text-[#3b82f6]">{station.station_area}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isInRange ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#3b82f6]/20 text-[#3b82f6]'
                    }`}>
                      #{index + 1}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2"><svg width="16" height="16" fill="none" viewBox="0 0 16 16"><rect x="2" y="6" width="12" height="4" rx="2" fill="#22c55e"/><rect x="6" y="8" width="4" height="2" rx="1" fill="#fff"/></svg> Capacity: {station.capacity}</div>
                      <div className="flex items-center gap-2"><svg width="16" height="16" fill="none" viewBox="0 0 16 16"><rect x="4" y="7" width="8" height="2" rx="1" fill="#3b82f6"/><rect x="7" y="8" width="2" height="2" rx="1" fill="#fff"/></svg> Charging: {station.charging_ports}</div>
                    </div>
                    {station.distance !== undefined && (
                      <div className="text-right">
                        <div className="font-bold text-[#22c55e]">
                          {station.distance.toFixed(2)} km
                        </div>
                        <div className="text-xs opacity-75">
                          {isInRange ? 'In Range' : 'Walk closer'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {nearbyStations.length === 0 && !loading && (
            <div className={`${cardClasses} rounded-xl p-12 text-center shadow-md`}>
              <span className="inline-block mb-4"><svg width="48" height="48" fill="none" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" stroke="#3b82f6" strokeWidth="4" fill="#fff"/><rect x="16" y="22" width="16" height="4" rx="2" fill="#3b82f6"/></svg></span>
              <h3 className="text-xl font-bold mb-2">No Stations Found</h3>
              <p className="opacity-75 mb-6">
                We couldn't find any stations in your area. Please ensure location access is enabled.
              </p>
              <button
                onClick={getCurrentLocation}
                className="bg-gradient-to-r from-[#22c55e] to-[#10b981] text-white px-6 py-3 rounded-xl font-semibold shadow-md"
              >
                Refresh Location
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
