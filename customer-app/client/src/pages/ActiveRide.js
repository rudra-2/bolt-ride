import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ActiveRide = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const rideData = location.state?.rideData;

    // If no ride data, redirect to stations
    useEffect(() => {
        if (!rideData) {
            navigate('/stations');
        }
    }, [rideData, navigate]);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [rideStats, setRideStats] = useState({
        distance: 0,
        duration: 0,
        fare: 0
    });
    const [nearbyStations, setNearbyStations] = useState([]);
    const [selectedEndStation, setSelectedEndStation] = useState(null);
    const [showEndRideModal, setShowEndRideModal] = useState(false);
    const [isWithinStationRange, setIsWithinStationRange] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const rideStartTime = useRef(new Date());
    const locationWatchId = useRef(null);
    const rideUpdateInterval = useRef(null);
    const mapRef = useRef(null);

    const [isDarkMode] = useState(() => {
        return localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && true);
    });

    const themeClasses = {
        bg: isDarkMode ? 'from-black via-gray-900 to-black' : 'from-gray-50 via-white to-gray-100',
        card: isDarkMode ? 'from-gray-800/90 to-gray-900/90 border-evgreen/20' : 'from-white/90 to-gray-50/90 border-evgreen/30',
        text: isDarkMode ? 'text-white' : 'text-gray-900',
        textSecondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
        button: isDarkMode ? 'bg-gray-800/50 hover:bg-gray-700/50' : 'bg-white/50 hover:bg-gray-100/50'
    };

    // Ahmedabad boundary coordinates (approximate)
    const ahmedabadBounds = {
        north: 23.1500,
        south: 23.0000,
        east: 72.7500,
        west: 72.4500
    };

    const baseFareRate = 5; // ₹5 per km
    const timeRate = 2; // ₹2 per minute

    useEffect(() => {
        initializeRide();
        startLocationTracking();
        fetchNearbyStations();
        startRideTimer();

        return () => {
            stopLocationTracking();
            if (rideUpdateInterval.current) {
                clearInterval(rideUpdateInterval.current);
            }
        };
    }, []);

    const initializeRide = () => {
        console.log('Initializing ride with data:', rideData);
        rideStartTime.current = new Date();
    };

    const startLocationTracking = () => {
        if (!navigator.geolocation) {
            setError('Geolocation not supported by this browser');
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 1000
        };

        locationWatchId.current = navigator.geolocation.watchPosition(
            (position) => {
                const newLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };

                setCurrentLocation(newLocation);
                checkBoundaries(newLocation);
                updateRideDistance(newLocation);
            },
            (error) => {
                console.error('Location error:', error);
                setError('Unable to track location. Please ensure GPS is enabled.');
            },
            options
        );
    };

    const stopLocationTracking = () => {
        if (locationWatchId.current) {
            navigator.geolocation.clearWatch(locationWatchId.current);
            locationWatchId.current = null;
        }
    };

    const checkBoundaries = (location) => {
        // Check if user is within Ahmedabad bounds
        const withinAhmedabad = (
            location.lat >= ahmedabadBounds.south &&
            location.lat <= ahmedabadBounds.north &&
            location.lng >= ahmedabadBounds.west &&
            location.lng <= ahmedabadBounds.east
        );

        if (!withinAhmedabad) {
            setError('WARNING: You are outside Ahmedabad city limits!');
        } else {
            setError('');
        }

        // Check if near any station for ending ride
        const nearStation = nearbyStations.find(station => {
            const stationLat = station.coordinates?.latitude || station.location?.coordinates?.[1];
            const stationLng = station.coordinates?.longitude || station.location?.coordinates?.[0];

            if (stationLat && stationLng) {
                const distance = calculateDistance(location.lat, location.lng, stationLat, stationLng);
                return distance <= 0.1; // 100 meters
            }
            return false;
        });

        setIsWithinStationRange(!!nearStation);
        if (nearStation) {
            setSelectedEndStation(nearStation);
        }
    };

    const updateRideDistance = (newLocation) => {
        setRideStats(prevStats => {
            if (!prevStats.lastLocation) {
                return { ...prevStats, lastLocation: newLocation };
            }

            const distanceIncrement = calculateDistance(
                prevStats.lastLocation.lat,
                prevStats.lastLocation.lng,
                newLocation.lat,
                newLocation.lng
            );

            const newDistance = prevStats.distance + distanceIncrement;
            const newFare = calculateFare(newDistance, prevStats.duration);

            return {
                ...prevStats,
                distance: newDistance,
                fare: newFare,
                lastLocation: newLocation
            };
        });
    };

    const startRideTimer = () => {
        rideUpdateInterval.current = setInterval(() => {
            const now = new Date();
            const durationMinutes = Math.floor((now - rideStartTime.current) / 60000);

            setRideStats(prevStats => {
                const newFare = calculateFare(prevStats.distance, durationMinutes);
                return {
                    ...prevStats,
                    duration: durationMinutes,
                    fare: newFare
                };
            });
        }, 1000);
    };

    const calculateDistance = (lat1, lng1, lat2, lng2) => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const calculateFare = (distance, durationMinutes) => {
        const distanceFare = distance * baseFareRate;
        const timeFare = durationMinutes * timeRate;
        return Math.max(10, distanceFare + timeFare); // Minimum fare ₹10
    };

    const fetchNearbyStations = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/stations/nearby?lat=23.0225&lng=72.5714', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setNearbyStations(data.stations || []);
            }
        } catch (error) {
            console.error('Error fetching stations:', error);
        }
    };

    const handleEndRide = async () => {
        if (!selectedEndStation) {
            setError('Please move to a nearby station to end the ride');
            return;
        }

        setLoading(true);
        try {
            const endTime = new Date();
            const rideEndData = {
                ride_id: rideData.rideId,
                drop_station_id: selectedEndStation.station_id,
                distance: parseFloat(rideStats.distance.toFixed(2)),
                total_time: rideStats.duration
            };

            const response = await fetch('http://localhost:5000/api/rides/end', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(rideEndData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to end ride');
            }

            const result = await response.json();
            console.log('Ride ended successfully:', result);

            // Show success message and navigate to dashboard
            alert(`Ride completed! Total fare: ₹${rideStats.fare.toFixed(2)}. Updated wallet balance: ₹${result.wallet_balance?.toFixed(2) || 'N/A'}`);
            navigate('/dashboard');

        } catch (error) {
            console.error('Error ending ride:', error);
            setError(error.message);
        } finally {
            setLoading(false);
            setShowEndRideModal(false);
        }
    };

    if (!rideData) {
        return null; // Component will redirect via useEffect
    }

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${remainingMinutes}m`;
        }
        return `${remainingMinutes}m`;
    };

    return (
        <div className={`min-h-screen bg-gradient-to-br ${themeClasses.bg}`}>
            {/* Header */}
            <div className={`bg-gradient-to-r ${themeClasses.card} backdrop-blur-sm border-b p-4`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="bg-evgreen p-3 rounded-xl mr-4">
                            <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8 5a1 1 0 100 2h5.586L9 11.586 7.707 10.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l5-5A1 1 0 0014 7H9a3 3 0 11-1-2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className={`text-xl font-bold ${themeClasses.text}`}>Active Ride</h1>
                            <p className={`${themeClasses.textSecondary} text-sm`}>
                                Vehicle: {rideData?.vehicleId} • Started: {rideStartTime.current.toLocaleTimeString()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-500 text-sm font-medium">Live</span>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div className="relative h-80 bg-gray-800 border-b">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-green-900">
                    {/* Ahmedabad City Boundary */}
                    <div className="absolute inset-4 border-4 border-dashed border-evgreen/50 rounded-xl bg-evgreen/5">
                        <div className="absolute -top-8 left-4 bg-evgreen/30 text-evgreen px-3 py-1 rounded-full text-sm font-bold">
                            🏙️ Ahmedabad City Riding Zone
                        </div>
                        
                        {/* User Location in the city */}
                        <div className="absolute" style={{ 
                            top: '50%', 
                            left: '50%', 
                            transform: 'translate(-50%, -50%)' 
                        }}>
                            <div className="relative">
                                <div className="w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-lg animate-pulse">
                                    <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                                        🚴‍♂️
                                    </div>
                                </div>
                                <div className="absolute inset-0 w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-50"></div>
                                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-black/75 text-white px-3 py-1 rounded-lg text-xs whitespace-nowrap">
                                    Active Ride • Vehicle: {rideData?.vehicleId}
                                </div>
                            </div>
                        </div>

                        {/* Station Markers */}
                        {nearbyStations.slice(0, 8).map((station, index) => {
                            const angle = (index * 360) / 8;
                            const radius = 60 + Math.random() * 40; // Random positioning within city
                            const x = Math.cos(angle * Math.PI / 180) * radius;
                            const y = Math.sin(angle * Math.PI / 180) * radius;
                            
                            const stationLat = station.coordinates?.latitude || station.location?.coordinates?.[1] || 0;
                            const stationLng = station.coordinates?.longitude || station.location?.coordinates?.[0] || 0;
                            const canEndHere = currentLocation && calculateDistance(
                                currentLocation.lat, currentLocation.lng, stationLat, stationLng
                            ) <= 0.1; // 100m for ending ride
                            
                            return (
                                <div
                                    key={station.station_id}
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                                    style={{
                                        left: `calc(50% + ${x}px)`,
                                        top: `calc(50% + ${y}px)`
                                    }}
                                >
                                    <div className={`relative transition-all duration-300 ${canEndHere ? 'scale-125 animate-bounce' : ''}`}>
                                        <div className={`w-6 h-6 rounded-full border-2 border-white shadow-lg ${
                                            canEndHere ? 'bg-evgreen' : 'bg-orange-500'
                                        }`}>
                                            <div className="w-full h-full flex items-center justify-center text-white text-xs">
                                                {canEndHere ? '🏁' : '🚲'}
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black/75 text-white px-1 py-0.5 rounded text-xs whitespace-nowrap">
                                            {station.station_name.split(' ')[0]}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Real-time boundary warnings */}
                        {currentLocation && (
                            <>
                                {/* Boundary warning zones */}
                                <div className="absolute top-2 right-2 left-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-2">
                                    <div className="text-yellow-300 text-xs font-medium flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        Stay within Ahmedabad city limits for safe riding
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Map Controls & Info */}
                    <div className="absolute bottom-4 left-4 bg-black/75 text-white p-3 rounded-xl">
                        <div className="text-xs space-y-1">
                            <div>📍 Current: {currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : 'Loading...'}</div>
                            <div>🚴‍♂️ Vehicle: {rideData?.vehicleId}</div>
                            <div>⏱️ Started: {rideStartTime.current.toLocaleTimeString()}</div>
                            <div>🏁 {nearbyStations.filter(s => {
                                const sLat = s.coordinates?.latitude || s.location?.coordinates?.[1] || 0;
                                const sLng = s.coordinates?.longitude || s.location?.coordinates?.[0] || 0;
                                return currentLocation && calculateDistance(currentLocation.lat, currentLocation.lng, sLat, sLng) <= 0.1;
                            }).length} stations available to end</div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="absolute bottom-4 right-4 bg-black/75 text-white p-3 rounded-xl">
                        <div className="text-xs space-y-1">
                            <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>Your Ride</div>
                            <div className="flex items-center"><div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>Station</div>
                            <div className="flex items-center"><div className="w-3 h-3 bg-evgreen rounded-full mr-2"></div>Can End Here</div>
                            <div className="flex items-center"><div className="w-3 h-3 border border-evgreen rounded-full mr-2"></div>City Limit</div>
                        </div>
                    </div>
                </div>

                {/* Geofence Status */}
                {error && (
                    <div className="absolute top-4 left-4 right-4 bg-red-500/90 text-white p-3 rounded-xl shadow-lg z-10">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    </div>
                )}

                {/* Station Range Indicator */}
                {isWithinStationRange && selectedEndStation && (
                    <div className="absolute bottom-20 left-4 right-4 bg-evgreen/90 text-black p-3 rounded-xl shadow-lg z-10">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium">
                                🏁 You can end your ride at {selectedEndStation?.station_name}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Ride Stats */}
            <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {/* Distance */}
                    <div className={`bg-gradient-to-br ${themeClasses.card} backdrop-blur-sm rounded-2xl p-4 border text-center`}>
                        <div className="bg-blue-500/20 p-3 rounded-xl mx-auto w-fit mb-3">
                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <div className={`text-2xl font-bold ${themeClasses.text}`}>
                            {rideStats.distance.toFixed(2)} km
                        </div>
                        <div className={`text-sm ${themeClasses.textSecondary}`}>Distance</div>
                    </div>

                    {/* Duration */}
                    <div className={`bg-gradient-to-br ${themeClasses.card} backdrop-blur-sm rounded-2xl p-4 border text-center`}>
                        <div className="bg-purple-500/20 p-3 rounded-xl mx-auto w-fit mb-3">
                            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className={`text-2xl font-bold ${themeClasses.text}`}>
                            {formatDuration(rideStats.duration)}
                        </div>
                        <div className={`text-sm ${themeClasses.textSecondary}`}>Duration</div>
                    </div>

                    {/* Current Fare */}
                    <div className={`bg-gradient-to-br ${themeClasses.card} backdrop-blur-sm rounded-2xl p-4 border text-center`}>
                        <div className="bg-evgreen/20 p-3 rounded-xl mx-auto w-fit mb-3">
                            <svg className="w-6 h-6 text-evgreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                        </div>
                        <div className="text-2xl font-bold text-evgreen">
                            ₹{rideStats.fare.toFixed(2)}
                        </div>
                        <div className={`text-sm ${themeClasses.textSecondary}`}>Current Fare</div>
                    </div>
                </div>

                {/* Fare Breakdown */}
                <div className={`bg-gradient-to-br ${themeClasses.card} backdrop-blur-sm rounded-2xl p-6 border mb-6`}>
                    <h3 className={`font-bold text-lg ${themeClasses.text} mb-4`}>Fare Breakdown</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className={themeClasses.textSecondary}>Distance ({rideStats.distance.toFixed(2)} km × ₹{baseFareRate}/km):</span>
                            <span className={themeClasses.text}>₹{(rideStats.distance * baseFareRate).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className={themeClasses.textSecondary}>Time ({rideStats.duration} min × ₹{timeRate}/min):</span>
                            <span className={themeClasses.text}>₹{(rideStats.duration * timeRate).toFixed(2)}</span>
                        </div>
                        <div className="border-t border-gray-300 dark:border-gray-600 pt-3 flex justify-between font-bold">
                            <span className={themeClasses.text}>Total:</span>
                            <span className="text-evgreen">₹{rideStats.fare.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* End Ride Button */}
                <button
                    onClick={() => setShowEndRideModal(true)}
                    disabled={!isWithinStationRange}
                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${isWithinStationRange
                            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white hover:scale-105 shadow-lg'
                            : 'bg-gray-500/50 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    <div className="flex items-center justify-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                        {isWithinStationRange ? 'End Ride' : 'Move to Station to End Ride'}
                    </div>
                </button>

                {!isWithinStationRange && (
                    <p className={`text-center ${themeClasses.textSecondary} text-sm mt-3`}>
                        Find a nearby charging station to end your ride safely
                    </p>
                )}
            </div>

            {/* End Ride Confirmation Modal */}
            {showEndRideModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className={`bg-gradient-to-br ${themeClasses.card} backdrop-blur-sm rounded-2xl p-6 m-4 max-w-md w-full border shadow-2xl`}>
                        <div className="text-center mb-6">
                            <div className="bg-red-500/20 p-4 rounded-full mx-auto w-fit mb-4">
                                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                </svg>
                            </div>
                            <h3 className={`text-xl font-bold ${themeClasses.text} mb-2`}>End Ride?</h3>
                            <p className={`${themeClasses.textSecondary} mb-4`}>
                                Are you sure you want to end your ride at {selectedEndStation?.station_name}?
                            </p>

                            {/* Final Summary */}
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mb-4">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className={`font-bold ${themeClasses.text}`}>{rideStats.distance.toFixed(2)} km</div>
                                        <div className={`text-xs ${themeClasses.textSecondary}`}>Distance</div>
                                    </div>
                                    <div>
                                        <div className={`font-bold ${themeClasses.text}`}>{formatDuration(rideStats.duration)}</div>
                                        <div className={`text-xs ${themeClasses.textSecondary}`}>Duration</div>
                                    </div>
                                    <div>
                                        <div className="font-bold text-evgreen">₹{rideStats.fare.toFixed(2)}</div>
                                        <div className={`text-xs ${themeClasses.textSecondary}`}>Total Fare</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowEndRideModal(false)}
                                className={`flex-1 ${themeClasses.button} border px-4 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105`}
                                disabled={loading}
                            >
                                Continue Ride
                            </button>
                            <button
                                onClick={handleEndRide}
                                disabled={loading}
                                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Ending...
                                    </div>
                                ) : (
                                    'End Ride'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActiveRide;
