import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { stationsAPI, vehiclesAPI, walletAPI, sessionsAPI, ridesAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [data, setData] = useState({
    stations: [],
    vehicles: [],
    walletBalance: 0,
    activeSession: null,
    rideHistory: []
  });

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userData || !token) {
      navigate('/');
      return;
    }

    setUser(JSON.parse(userData));
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [stationsRes, walletRes, sessionRes, ridesRes] = await Promise.all([
        stationsAPI.getAll().catch(() => ({ data: { stations: [] } })),
        walletAPI.getBalance().catch(() => ({ data: { balance: 0 } })),
        sessionsAPI.getActive().catch(() => ({ data: { session: null } })),
        ridesAPI.getHistory().catch(() => ({ data: { rides: [] } }))
      ]);

      setData({
        stations: stationsRes.data.stations || [],
        walletBalance: walletRes.data.balance || 0,
        activeSession: sessionRes.data.session,
        rideHistory: ridesRes.data.rides || []
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleStartRide = async (vehicleId) => {
    try {
      const response = await ridesAPI.start(vehicleId);
      if (response.data.success) {
        alert('Ride started successfully!');
        loadDashboardData(); // Refresh data
      }
    } catch (error) {
      alert('Failed to start ride: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const handleEndRide = async (rideId) => {
    try {
      const response = await ridesAPI.end(rideId);
      if (response.data.success) {
        alert('Ride ended successfully!');
        loadDashboardData(); // Refresh data
      }
    } catch (error) {
      alert('Failed to end ride: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const addFunds = async () => {
    const amount = prompt('Enter amount to add:');
    if (amount && !isNaN(amount)) {
      try {
        await walletAPI.addFunds(parseFloat(amount));
        alert('Funds added successfully!');
        loadDashboardData();
      } catch (error) {
        alert('Failed to add funds');
      }
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>⚡ Bolt Ride</h1>
          <div className="user-section">
            <span>Welcome, {user?.customer_name || user?.name}!</span>
            <button onClick={handleLogout} className="btn btn-outline">Logout</button>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button 
          className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          🏠 Home
        </button>
        <button 
          className={`nav-btn ${activeTab === 'stations' ? 'active' : ''}`}
          onClick={() => setActiveTab('stations')}
        >
          📍 Stations
        </button>
        <button 
          className={`nav-btn ${activeTab === 'wallet' ? 'active' : ''}`}
          onClick={() => setActiveTab('wallet')}
        >
          💳 Wallet
        </button>
        <button 
          className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📊 History
        </button>
      </nav>

      <main className="dashboard-main">
        {activeTab === 'home' && (
          <div className="tab-content">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Wallet Balance</h3>
                <p className="stat-value">₹{data.walletBalance}</p>
                <button onClick={addFunds} className="btn btn-small">Add Funds</button>
              </div>
              <div className="stat-card">
                <h3>Available Stations</h3>
                <p className="stat-value">{data.stations.length}</p>
              </div>
              <div className="stat-card">
                <h3>Total Rides</h3>
                <p className="stat-value">{data.rideHistory.length}</p>
              </div>
            </div>

            {data.activeSession && (
              <div className="active-session">
                <h3>🚗 Active Ride Session</h3>
                <p>Vehicle: {data.activeSession.vehicleId}</p>
                <p>Started: {new Date(data.activeSession.startTime).toLocaleString()}</p>
                <button 
                  onClick={() => handleEndRide(data.activeSession._id)}
                  className="btn btn-danger"
                >
                  End Ride
                </button>
              </div>
            )}

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button onClick={() => setActiveTab('stations')} className="btn btn-primary">
                  Find Vehicles
                </button>
                <button onClick={() => setActiveTab('wallet')} className="btn btn-secondary">
                  Manage Wallet
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stations' && (
          <div className="tab-content">
            <h2>Parking Stations</h2>
            <div className="stations-grid">
              {data.stations.length > 0 ? data.stations.map((station) => (
                <div key={station._id} className="station-card">
                  <h3>{station.name}</h3>
                  <p>📍 {station.location}</p>
                  <p>🔋 {station.availableVehicles || 0} vehicles available</p>
                  <p>⚡ {station.chargingPorts || 0} charging ports</p>
                  <button 
                    onClick={() => alert(`Viewing vehicles at ${station.name}`)}
                    className="btn btn-primary"
                  >
                    View Vehicles
                  </button>
                </div>
              )) : (
                <p>No stations available</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="tab-content">
            <h2>Wallet Management</h2>
            <div className="wallet-section">
              <div className="balance-card">
                <h3>Current Balance</h3>
                <p className="balance-amount">₹{data.walletBalance}</p>
                <button onClick={addFunds} className="btn btn-primary">Add Funds</button>
              </div>
              
              <div className="wallet-actions">
                <h4>Quick Add</h4>
                <div className="quick-add-buttons">
                  {[100, 500, 1000, 2000].map(amount => (
                    <button 
                      key={amount}
                      onClick={() => walletAPI.addFunds(amount).then(() => {
                        alert(`₹${amount} added successfully!`);
                        loadDashboardData();
                      }).catch(() => alert('Failed to add funds'))}
                      className="btn btn-outline"
                    >
                      +₹{amount}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="tab-content">
            <h2>Ride History</h2>
            <div className="history-list">
              {data.rideHistory.length > 0 ? data.rideHistory.map((ride, index) => (
                <div key={ride._id || index} className="history-item">
                  <div className="ride-info">
                    <h4>Ride #{index + 1}</h4>
                    <p>🚗 Vehicle: {ride.vehicleId}</p>
                    <p>📅 Date: {new Date(ride.startTime).toLocaleDateString()}</p>
                    <p>⏰ Duration: {ride.duration || 'N/A'}</p>
                  </div>
                  <div className="ride-cost">
                    <span className="cost">₹{ride.cost || 0}</span>
                  </div>
                </div>
              )) : (
                <p>No rides yet. Start your first ride!</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
