import React, { useState, useEffect } from "react";
import { fetchRides } from "../api/rides";
import { useParams, useNavigate } from "react-router-dom";

export default function Rides() {
  const { stationId } = useParams();
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const loadRides = async () => {
      if (!stationId) return;
      
      setLoading(true);
      setError(null);
      
      const data = await fetchRides(stationId);
      
      if (data.status === "success") {
        // Convert ISO strings to proper Date objects
        const ridesWithDates = data.rides.map(r => ({
          ...r,
          start_time: r.start_time ? new Date(r.start_time) : null,
          end_time: r.end_time ? new Date(r.end_time) : null,
        }));
        setRides(ridesWithDates);
      } else {
        setError(data.message || "Failed to fetch rides");
      }
      
      setLoading(false);
    };
    
    loadRides();
  }, [stationId]);

  const filteredRides = rides.filter((ride) => {
    const matchesSearch =
      (ride.ride_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ride.user_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ride.vehicle_id || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || ride.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusClass = (status) => {
    if (status === "completed") return "bg-green-100 text-green-800";
    if (status === "active") return "bg-blue-100 text-blue-800";
    if (status === "cancelled") return "bg-red-100 text-red-800";
    return "bg-gray-200 text-gray-800";
  };

  const formatDate = (date) => date ? date.toLocaleString() : "N/A";

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Error Loading Rides</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate(`/dashboard/${stationId}`)} 
            className="text-gray-500 hover:text-gray-800"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Rides Management</h1>
            <p className="text-sm text-gray-500">Monitor and manage all ride activities - Station {stationId}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white shadow rounded-lg p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">🚗</div>
            <div>
              <p className="text-sm text-gray-500">Total Rides</p>
              <p className="text-2xl font-bold">{rides.length}</p>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">✅</div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">{rides.filter(r => r.status === "completed").length}</p>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">⏱️</div>
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-blue-600">{rides.filter(r => r.status === "active").length}</p>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center">💰</div>
            <div>
              <p className="text-sm text-gray-500">Revenue</p>
              <p className="text-2xl font-bold">₹{rides.filter(r => r.status === "completed").reduce((sum,r)=>sum+(r.fare||0),0)}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by Ride ID, User ID, Vehicle ID..."
            className="flex-1 px-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <select
            className="px-4 py-2 border rounded-lg"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Ride List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading rides...</div>
          </div>
        ) : filteredRides.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No rides found</div>
        ) : (
          <div className="space-y-4">
            {filteredRides.map(ride => (
              <div key={ride.ride_id} className="bg-white shadow rounded-lg p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-800">{ride.ride_id}</h3>
                  <p className="text-sm text-gray-500">User: {ride.user_id} | Vehicle: {ride.vehicle_id}</p>
                  <p className="text-sm text-gray-500">
                    Fare: ₹{ride.fare || 0} | Distance: {ride.distance_km || 0} km | Duration: {ride.duration_minutes || 0} min
                  </p>
                  <p className="text-xs text-gray-400">
                    Payment: {ride.payment_status || 'pending'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs ${getStatusClass(ride.status)}`}>{ride.status}</span>
                  <p className="text-xs text-gray-400 mt-1">
                    Start: {formatDate(ride.start_time)}
                  </p>
                  <p className="text-xs text-gray-400">
                    End: {ride.end_time ? formatDate(ride.end_time) : "Ongoing"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
