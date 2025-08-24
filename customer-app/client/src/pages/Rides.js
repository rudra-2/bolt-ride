import React, { useState, useEffect } from 'react';
import { ridesAPI } from '../api';

const Rides = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRide, setSelectedRide] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && true);
  });

  useEffect(() => {
    fetchRides();
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const fetchRides = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/rides/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch rides');
      }

      const data = await response.json();
      setRides(data.rides || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes || minutes === 0) return '0 min';
    
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-evgreen/20 text-evgreen border-evgreen/30';
      case 'ongoing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
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
          <p className={themeClasses.text}>Loading ride history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeClasses.bg} p-6`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-evgreen to-green-300 bg-clip-text text-transparent mb-2">
              Ride History
            </h1>
            <p className={themeClasses.textSecondary}>Track your eco-friendly journeys</p>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`${themeClasses.button} p-3 rounded-full border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} transition-all duration-300 hover:scale-110`}
          >
            {isDarkMode ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-300">❌ {error}</p>
          </div>
        )}

        {/* Stats Cards */}
        {rides.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className={`bg-gradient-to-br ${themeClasses.card} backdrop-blur-sm rounded-xl p-4 border text-center`}>
                <div className="mb-2 flex justify-center">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="16" r="14" stroke="#22c55e" strokeWidth="3" fill="#fff"/>
                    <rect x="10" y="14" width="12" height="4" rx="2" fill="#22c55e"/>
                    <rect x="14" y="10" width="4" height="12" rx="2" fill="#22c55e"/>
                  </svg>
                </div>
              <div className={`text-2xl font-bold ${themeClasses.text}`}>{rides.length}</div>
              <div className={`text-sm ${themeClasses.textSecondary}`}>Total Rides</div>
            </div>

            <div className={`bg-gradient-to-br ${themeClasses.card} backdrop-blur-sm rounded-xl p-4 border text-center`}>
                <div className="mb-2 flex justify-center">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect x="6" y="14" width="20" height="4" rx="2" fill="#3b82f6"/>
                    <circle cx="8" cy="16" r="2" fill="#3b82f6"/>
                    <circle cx="24" cy="16" r="2" fill="#3b82f6"/>
                  </svg>
                </div>
              <div className={`text-2xl font-bold ${themeClasses.text}`}>
                {rides.reduce((sum, ride) => sum + (ride.distance_km || 0), 0).toFixed(1)} km
              </div>
              <div className={`text-sm ${themeClasses.textSecondary}`}>Total Distance</div>
            </div>

            <div className={`bg-gradient-to-br ${themeClasses.card} backdrop-blur-sm rounded-xl p-4 border text-center`}>
                <div className="mb-2 flex justify-center">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="16" r="14" stroke="#a78bfa" strokeWidth="3" fill="#fff"/>
                    <path d="M16 10v6l4 2" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              <div className={`text-2xl font-bold ${themeClasses.text}`}>
                {formatDuration(rides.reduce((sum, ride) => sum + (ride.duration_minutes || 0), 0))}
              </div>
              <div className={`text-sm ${themeClasses.textSecondary}`}>Total Time</div>
            </div>

            <div className={`bg-gradient-to-br ${themeClasses.card} backdrop-blur-sm rounded-xl p-4 border text-center`}>
                <div className="mb-2 flex justify-center">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect x="8" y="12" width="16" height="8" rx="4" fill="#facc15"/>
                    <circle cx="16" cy="16" r="4" fill="#fff"/>
                    <text x="16" y="20" textAnchor="middle" fontSize="10" fill="#facc15">₹</text>
                  </svg>
                </div>
              <div className={`text-2xl font-bold ${themeClasses.text}`}>
                ₹{rides.reduce((sum, ride) => sum + (ride.fare || ride.amount || 0), 0).toFixed(2)}
              </div>
              <div className={`text-sm ${themeClasses.textSecondary}`}>Total Spent</div>
            </div>
          </div>
        )}

        {/* Rides List */}
        {rides.length > 0 ? (
          <div className="space-y-4">
            {rides.map((ride) => (
              <div
                key={ride.ride_id}
                className={`bg-gradient-to-br ${themeClasses.card} backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 hover:scale-102 hover:shadow-xl cursor-pointer`}
                onClick={() => setSelectedRide(selectedRide?.ride_id === ride.ride_id ? null : ride)}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  {/* Ride Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(ride.status)}`}>
                        {ride.status?.toUpperCase() || 'UNKNOWN'}
                      </div>
                      <div className={`${themeClasses.textSecondary} text-sm`}>
                        {formatDate(ride.start_time)}
                      </div>
                    </div>

                    <h3 className={`text-lg font-semibold ${themeClasses.text} mb-1`}>
                      Ride #{ride.ride_id?.split('_')[1] || 'N/A'}
                    </h3>

                    <p className={`${themeClasses.textSecondary} text-sm`}>
                      Vehicle: {ride.vehicle_id} • Station: {ride.station_id}
                    </p>
                  </div>

                  {/* Ride Stats */}
                  <div className="flex gap-6 text-center">
                    <div>
                      <div className={`text-lg font-bold ${themeClasses.text}`}>
                        {ride.distance_km ? `${ride.distance_km} km` : 'N/A'}
                      </div>
                      <div className={`text-xs ${themeClasses.textSecondary}`}>Distance</div>
                    </div>

                    <div>
                      <div className={`text-lg font-bold ${themeClasses.text}`}>
                        {formatDuration(ride.duration_minutes)}
                      </div>
                      <div className={`text-xs ${themeClasses.textSecondary}`}>Duration</div>
                    </div>

                    <div>
                      <div className="text-lg font-bold text-evgreen">
                        ₹{(ride.fare || ride.amount || 0).toFixed(2)}
                      </div>
                      <div className={`text-xs ${themeClasses.textSecondary}`}>Fare</div>
                    </div>
                  </div>

                  {/* Expand Arrow */}
                  <div className={`${themeClasses.text} transition-transform duration-300 ${selectedRide?.ride_id === ride.ride_id ? 'rotate-180' : ''
                    }`}>
                    ▼
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedRide?.ride_id === ride.ride_id && (
                  <div className="mt-6 pt-6 border-t border-gray-600 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Timeline */}
                      <div>
                        <h4 className={`font-semibold ${themeClasses.text} mb-3`}>Journey Timeline</h4>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-evgreen rounded-full mr-3"></div>
                            <div>
                              <div className={`font-medium ${themeClasses.text}`}>Ride Started</div>
                              <div className={`text-sm ${themeClasses.textSecondary}`}>
                                {formatDate(ride.start_time)}
                              </div>
                            </div>
                          </div>

                          {ride.end_time && (
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-red-400 rounded-full mr-3"></div>
                              <div>
                                <div className={`font-medium ${themeClasses.text}`}>Ride Ended</div>
                                <div className={`text-sm ${themeClasses.textSecondary}`}>
                                  {formatDate(ride.end_time)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Additional Details */}
                      <div>
                        <h4 className={`font-semibold ${themeClasses.text} mb-3`}>Ride Details</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className={themeClasses.textSecondary}>Pickup Station:</span>
                            <span className={themeClasses.text}>{ride.station_id || 'N/A'}</span>
                          </div>

                          {ride.drop_station_id && (
                            <div className="flex justify-between">
                              <span className={themeClasses.textSecondary}>Drop Station:</span>
                              <span className={themeClasses.text}>{ride.drop_station_id}</span>
                            </div>
                          )}

                          <div className="flex justify-between">
                            <span className={themeClasses.textSecondary}>Vehicle ID:</span>
                            <span className={themeClasses.text}>{ride.vehicle_id}</span>
                          </div>

                          <div className="flex justify-between">
                            <span className={themeClasses.textSecondary}>Vehicle Number:</span>
                            <span className={themeClasses.text}>{ride.vehicle_number || 'N/A'}</span>
                          </div>

                          <div className="flex justify-between">
                            <span className={themeClasses.textSecondary}>Payment Status:</span>
                            <span className={`${ride.payment_status === 'paid' ? 'text-green-400' : ride.payment_status === 'pending' ? 'text-yellow-400' : 'text-red-400'}`}>
                              {ride.payment_status?.toUpperCase() || 'N/A'}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className={themeClasses.textSecondary}>Amount Paid:</span>
                            <span className="text-evgreen font-semibold">₹{(ride.fare || ride.amount || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-8xl mb-6 flex justify-center">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="28" fill="#e5e7eb" stroke="#22c55e" strokeWidth="4"/>
                <rect x="24" y="30" width="16" height="4" rx="2" fill="#22c55e"/>
                <rect x="30" y="24" width="4" height="16" rx="2" fill="#22c55e"/>
              </svg>
            </div>
            <h3 className={`text-3xl font-bold ${themeClasses.text} mb-4`}>No Rides Yet</h3>
            <p className={`${themeClasses.textSecondary} text-lg mb-8`}>
              Start your first eco-friendly journey today!
            </p>
            <button
              onClick={() => window.location.href = '/stations'}
              className="bg-gradient-to-r from-evgreen to-green-400 text-black px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg text-lg"
            >
              Find Stations
            </button>
          </div>
        )}
      </div>

      {/* Custom Styles for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default Rides;
