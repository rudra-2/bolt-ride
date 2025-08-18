// pages/dashboard.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchStationSummary, fetchActiveRides, fetchVehiclesLite, fetchStationDetails } from '../api/dashboard';

const badgeClass = (status) => {
  switch (status) {
    case "available": return "bg-green-100 text-green-800";
    case "active": return "bg-blue-100 text-blue-800";
    case "maintenance": return "bg-yellow-100 text-yellow-800";
    case "charging": return "bg-purple-100 text-purple-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const batteryColor = (n) =>
  n > 50 ? "text-green-600" : n > 20 ? "text-yellow-600" : "text-red-600";

export default function Dashboard() {
  const { stationId } = useParams();
  const navigate = useNavigate();

  const [station, setStation] = useState({});
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalRides: 0,
    activeRides: 0,
    totalCollection: 0,
    pendingPayments: 0,
  });
  const [vehicles, setVehicles] = useState([]);
  const [activeRides, setActiveRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [statsRes, ridesRes, vehiclesRes, stationRes] = await Promise.all([
          fetchStationSummary(stationId),
          fetchActiveRides(stationId),
          fetchVehiclesLite(stationId),
          fetchStationDetails(stationId)
        ]);

        // Handle stats
        if (statsRes.status === 'success') {
          setStats(statsRes.data);
        } else {
          console.error('Stats error:', statsRes.message);
        }

        // Handle active rides
        if (ridesRes.status === 'success') {
          setActiveRides(ridesRes.rides || []);
        } else {
          console.error('Rides error:', ridesRes.message);
        }

        // Handle vehicles
        if (vehiclesRes.status === 'success') {
          setVehicles(vehiclesRes.vehicles || []);
        } else {
          console.error('Vehicles error:', vehiclesRes.message);
        }

        // Handle station details
        if (stationRes.status === 'success') {
          setStation(stationRes.station || {});
        } else {
          console.error('Station error:', stationRes.message);
        }

      } catch (error) {
        console.error('Dashboard loading error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (stationId) {
      loadDashboardData();
    }
  }, [stationId]);

  const location = station.location || {};

  // Add error display
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Error Loading Dashboard</h2>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {station.name || `Station ${stationId}`} Dashboard
            </h1>
            <p className="text-gray-600">{station.address || "Loading station details..."}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Last updated</p>
            <p className="font-semibold">{new Date().toLocaleString()}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <StatCard
            label="Total Vehicles"
            value={stats.totalVehicles}
            icon="🚗"
            description="Available fleet"
          />
          <StatCard
            label="Active Rides"
            value={stats.activeRides}
            icon="🚴"
            description="Currently ongoing"
            textColor="text-blue-600"
          />
          <StatCard
            label="Total Rides"
            value={stats.totalRides}
            icon="📊"
            description="All time"
          />
          <StatCard
            label="Total Collection"
            value={`₹${stats.totalCollection?.toLocaleString() || 0}`}
            icon="💰"
            description="Revenue earned"
            textColor="text-green-600"
          />
          <StatCard
            label="Pending Payments"
            value={`₹${stats.pendingPayments?.toLocaleString() || 0}`}
            icon="⏳"
            description="Awaiting payment"
            textColor="text-orange-600"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          <FleetSection vehicles={vehicles} loading={loading} stationId={stationId} />
          <ActiveRidesSection 
            activeRides={activeRides} 
            loading={loading} 
            navigate={navigate} 
            stationId={stationId} 
          />
        </div>

        <StationDetailsSection 
          station={station} 
          location={location} 
          navigate={navigate} 
          stationId={stationId} 
        />
      </div>
    </div>
  );
}

// ---------------- Components ----------------

const StatCard = ({ label, value, icon, description, textColor }) => (
  <div className="bg-white rounded-2xl shadow p-4">
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500">{label}</p>
      <span className="text-gray-400">{icon}</span>
    </div>
    <div className={`text-2xl font-bold mt-2 ${textColor || "text-gray-800"}`}>{value}</div>
    <p className="text-xs text-gray-400">{description}</p>
  </div>
);

const FleetSection = ({ vehicles, loading, stationId }) => (
  <div>
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-800">Vehicle Fleet</h2>
      <Link
        to={`/vehicles/${stationId}`}
        className="px-3 py-2 rounded-lg bg-green-600 text-white shadow hover:bg-green-700 transition"
      >
        Manage Vehicles
      </Link>
    </div>
    <div className="space-y-4">
      {loading && <div className="text-gray-500">Loading vehicles…</div>}
      {!loading && vehicles.map((v) => (
        <div className="bg-white rounded-2xl shadow p-4" key={v.vehicle_id || v.id}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                <span className="text-green-600">🚙</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{v.vehicle_number || v.number}</h3>
                <p className="text-sm text-gray-500">{v.type || "Scooter"} • {v.vehicle_id || v.id}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`px-2 py-1 rounded text-xs ${badgeClass(v.status)}`}>{v.status}</span>
              <p className={`text-sm font-medium mt-1 ${batteryColor(v.battery ?? 0)}`}>🔋 {v.battery ?? 0}%</p>
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="mt-4 text-center">
      <Link
        to={`/vehicles/${stationId}`}
        className="px-3 py-2 rounded-lg border shadow-sm hover:bg-gray-50 transition text-sm"
      >
        View All Vehicles
      </Link>
    </div>
  </div>
);

const ActiveRidesSection = ({ activeRides, loading, navigate, stationId }) => (
  <div>
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-800">Active Rides</h2>
      <button
        onClick={() => navigate(`/rides/${stationId}`)}
        className="px-3 py-2 rounded-lg border shadow-sm hover:bg-gray-50 transition text-sm"
      >
        View All Rides
      </button>
    </div>
    <div className="space-y-4">
      {loading && <div className="text-gray-500">Loading rides…</div>}
      {!loading && activeRides.map((r) => (
        <div className="bg-white rounded-2xl shadow p-4" key={r.ride_id || r.id}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">{r.user_id || r.user}</h3>
              <p className="text-sm text-gray-500">
                {r.vehicle_id || r.vehicle} • Started {new Date(r.start_time).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">{r.status}</span>
              <p className="text-xs text-gray-500 mt-1">⏱ {r.duration_minutes || "—"} mins</p>
            </div>
          </div>
        </div>
      ))}
      {!loading && activeRides.length === 0 && <div className="text-gray-500">No active rides.</div>}
    </div>
  </div>
);

const StationDetailsSection = ({ station, location, navigate, stationId }) => (
  <div className="mt-8">
    <h2 className="text-2xl font-bold text-gray-800 mb-6">Station Details</h2>
    <div className="grid md:grid-cols-3 gap-6">
      {/* Charging Ports */}
      <div className="bg-white rounded-2xl shadow p-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">📍 Charging Ports</h3>
        <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
          {station.ports?.map((port) => (
            <div key={port.port_id} className="flex justify-between text-sm bg-gray-50 rounded p-2">
              <span>{port.port_id}</span>
              <span className={`px-2 py-1 rounded text-xs ${badgeClass(port.status)}`}>{port.status}</span>
            </div>
          )) || <p className="text-gray-500">No ports data available.</p>}
        </div>
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate(`/charging-ports/${stationId}`)}
            className="px-3 py-2 rounded-lg border shadow-sm hover:bg-gray-50 transition text-sm"
          >
            View All Charging Ports
          </button>
        </div>
      </div>

      {/* Location */}
      {/* <div className="bg-white rounded-2xl shadow p-4">
        <h3 className="font-semibold text-gray-1000 flex items-center gap-2">📌 Location Details</h3>
        <p className="text-sm text-gray-800 mt-2">Address : {station.address || ""}</p>
        <p className="text-sm text-gray-800">City : {station.city || ""}, {station.state || ""}</p>
        <p className="text-sm text-gray-800">Capacity : {station.capacity || ""}</p>
        <p className="text-sm text-gray-800">{location.zip || ""}</p>
      </div> */}
      {/* Today Performance */}
<div className="bg-white rounded-2xl shadow p-4">
  <h3 className="font-semibold text-gray-800 flex items-center gap-2">📌 Today’s Performance</h3>
  <div className="mt-3 space-y-2 text-sm">
    <div className="flex justify-between">
      <span className="text-gray-500">Total Rides Today</span>
      <span className="font-semibold">{station.today_rides || 0}</span>
    </div>
    <div className="flex justify-between">
      <span className="text-gray-500">Total Revenue Today</span>
      <span className="font-semibold">₹{Number(station.today_revenue || 0).toLocaleString()}</span>
    </div>
    <div className="flex justify-between">
      <span className="text-gray-500">Active Users</span>
      <span className="font-semibold">{station.today_active_users || 0}</span>
    </div>
    <div className="flex justify-between">
      <span className="text-gray-500">Peak Hours</span>
      <span className="font-semibold">{station.peak_hours || "—"}</span>
    </div>
    <div className="flex justify-between">
      <span className="text-gray-500">Avg Ride Distance</span>
      <span className="font-semibold">{station.average_distance_km || "0"} km</span>
    </div>
    <div className="flex justify-between">
      <span className="text-gray-500">Popular Route</span>
      <span className="font-semibold">{station.popular_route || "—"}</span>
    </div>
  </div>
</div>


      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button onClick={() => navigate(`/payments/${stationId}`)} className="w-full px-3 py-2 rounded-lg border shadow-sm hover:bg-gray-50 text-left text-sm">💰 Payment Management</button>
          <button onClick={() => navigate(`/reports/${stationId}`)} className="w-full px-3 py-2 rounded-lg border shadow-sm hover:bg-gray-50 text-left text-sm">📊 Reports & Analytics</button>
          <button onClick={() => navigate(`/settings/${stationId}`)} className="w-full px-3 py-2 rounded-lg border shadow-sm hover:bg-gray-50 text-left text-sm">⚙️ Station Settings</button>
        </div>
      </div>
    </div>
  </div>
);
