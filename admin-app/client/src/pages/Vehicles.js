import React, { useState, useEffect, useCallback } from "react";
import { 
  fetchVehicles, 
  addVehicle, 
  updateVehicle, 
  deleteVehicle, 
  getNearbyStations, 
  transferVehicle,
  updateVehicleStatus,
  getVehicleHistory // Add this import
} from "../api/vehicles";
import { useParams, useNavigate } from "react-router-dom";

export default function Vehicles() {
  const { stationId } = useParams();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [capacityInfo, setCapacityInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false); // Add this
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [nearbyStations, setNearbyStations] = useState([]);
  const [vehicleHistory, setVehicleHistory] = useState([]); // Add this
  const [historyLoading, setHistoryLoading] = useState(false); // Add this
  
  // Form states
  const [formData, setFormData] = useState({
    vehicle_id: "",
    vehicle_number: "",
    vehicle_name: "",
    type: "",
    model: "",
    battery: 100,
    status: "available",
    odometer_reading: 0,
    rental_rate: { per_km: 0, per_hour: 0 },
    last_service: ""
  });

  // Helper function to format location
  const formatLocation = (location) => {
    if (!location) return "Location not specified";
    
    if (typeof location === "string") return location;
    
    if (typeof location === "object") {
      const parts = [];
      if (location.address) parts.push(location.address);
      if (location.city) parts.push(location.city);
      if (location.state) parts.push(location.state);
      if (location.pincode) parts.push(location.pincode);
      
      return parts.length > 0 ? parts.join(", ") : "Location not specified";
    }
    
    return "Location not specified";
  };

  // Add this helper function for date formatting
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const loadVehicles = useCallback(async (silent = false) => {
    if (!stationId) return;
    
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    
    const data = await fetchVehicles(stationId);
    
    if (data.status === "success") {
      setVehicles(data.vehicles || []);
      setCapacityInfo(data.capacity_info || null);
    } else {
      setError(data.message || "Failed to fetch vehicles");
    }
    
    if (!silent) {
      setLoading(false);
    }
  }, [stationId]);

  // Auto-refresh for charging vehicles
  useEffect(() => {
    const hasChargingVehicles = vehicles.some(vehicle => vehicle.status === "charging");
    
    if (hasChargingVehicles) {
      console.log("🔋 Found charging vehicles, starting auto-refresh...");
      const interval = setInterval(() => {
        console.log("🔄 Auto-refreshing vehicles data...");
        loadVehicles(true); // Silent refresh
      }, 10000); // Refresh every 10 seconds
      
      return () => {
        console.log("⏹️ Stopping auto-refresh");
        clearInterval(interval);
      };
    }
  }, [vehicles, loadVehicles]);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      (vehicle.vehicle_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vehicle.vehicle_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vehicle.vehicle_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;
    const matchesType = typeFilter === "all" || vehicle.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusClass = (status) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800";
      case "in_use": return "bg-blue-100 text-blue-800";
      case "charging": return "bg-yellow-100 text-yellow-800";
      case "maintenance": return "bg-red-100 text-red-800";
      case "offline": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getBatteryColor = (battery) => {
    if (battery >= 80) return "text-green-600";
    if (battery >= 50) return "text-yellow-600";
    if (battery >= 20) return "text-orange-600";
    return "text-red-600";
  };

  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "scooter": return "🛵";
      case "bike": return "🏍️";
      case "car": return "🚗";
      case "auto": return "🛺";
      default: return "🚗";
    }
  };

  // Add this function for quick status updates
  const handleQuickStatusUpdate = async (vehicle, newStatus) => {
    const result = await updateVehicleStatus(vehicle.vehicle_id, newStatus);
    
    if (result.status === "success") {
      loadVehicles(); // Reload to get updated data
    } else {
      alert(result.message || "Failed to update vehicle status");
    }
  };

  // Add this function to load vehicle history
  const loadVehicleHistory = async (vehicleId) => {
    setHistoryLoading(true);
    const result = await getVehicleHistory(vehicleId);
    
    if (result.status === "success") {
      setVehicleHistory(result.history || []);
    } else {
      setVehicleHistory([]);
      alert(result.message || "Failed to load vehicle history");
    }
    
    setHistoryLoading(false);
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    
    const vehicleData = {
      ...formData,
      station_id: stationId,
      battery: parseInt(formData.battery),
      odometer_reading: parseInt(formData.odometer_reading),
      rental_rate: {
        per_km: parseFloat(formData.rental_rate.per_km),
        per_hour: parseFloat(formData.rental_rate.per_hour)
      }
    };
    
    const result = await addVehicle(vehicleData);
    
    if (result.status === "success") {
      setShowAddModal(false);
      resetForm();
      loadVehicles();
    } else {
      alert(result.message || "Failed to add vehicle");
    }
  };

  const handleEditVehicle = async (e) => {
    e.preventDefault();
    
    if (!selectedVehicle) return;
    
    const updateData = {
      ...formData,
      battery: parseInt(formData.battery),
      odometer_reading: parseInt(formData.odometer_reading),
      rental_rate: {
        per_km: parseFloat(formData.rental_rate.per_km),
        per_hour: parseFloat(formData.rental_rate.per_hour)
      }
    };
    
    const result = await updateVehicle(selectedVehicle.vehicle_id, updateData);
    
    if (result.status === "success") {
      setShowEditModal(false);
      setSelectedVehicle(null);
      resetForm();
      loadVehicles();
    } else {
      alert(result.message || "Failed to update vehicle");
    }
  };

  const handleDeleteVehicle = async () => {
    if (!selectedVehicle) return;
    
    const result = await deleteVehicle(selectedVehicle.vehicle_id);
    
    if (result.status === "success") {
      setShowDeleteModal(false);
      setSelectedVehicle(null);
      loadVehicles();
    } else {
      alert(result.message || "Failed to delete vehicle");
    }
  };

  const handleTransferVehicle = async (targetStationId) => {
    if (!selectedVehicle) return;
    
    const result = await transferVehicle(selectedVehicle.vehicle_id, stationId, targetStationId);
    
    if (result.status === "success") {
      setShowTransferModal(false);
      setSelectedVehicle(null);
      loadVehicles();
    } else {
      alert(result.message || "Failed to transfer vehicle");
    }
  };

  const openEditModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData({
      vehicle_id: vehicle.vehicle_id,
      vehicle_number: vehicle.vehicle_number,
      vehicle_name: vehicle.vehicle_name,
      type: vehicle.type,
      model: vehicle.model,
      battery: vehicle.battery,
      status: vehicle.status,
      odometer_reading: vehicle.odometer_reading,
      rental_rate: vehicle.rental_rate,
      last_service: vehicle.last_service?.split('T')[0] || ""
    });
    setShowEditModal(true);
  };

  const openTransferModal = async (vehicle) => {
    setSelectedVehicle(vehicle);
    const stationsData = await getNearbyStations(stationId);
    if (stationsData.status === "success") {
      setNearbyStations(stationsData.stations || []);
      setShowTransferModal(true);
    } else {
      alert("Failed to load nearby stations");
    }
  };

  // Add this function to open history modal
  const openHistoryModal = async (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowHistoryModal(true);
    await loadVehicleHistory(vehicle.vehicle_id);
  };

  const resetForm = () => {
    setFormData({
      vehicle_id: "",
      vehicle_number: "",
      vehicle_name: "",
      type: "",
      model: "",
      battery: 100,
      status: "available",
      odometer_reading: 0,
      rental_rate: { per_km: 0, per_hour: 0 },
      last_service: ""
    });
  };

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Error Loading Vehicles</h2>
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate(`/dashboard/${stationId}`)} 
            className="text-gray-500 hover:text-gray-800"
          >
            ← Back
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">Vehicle Management</h1>
            <p className="text-sm text-gray-500">
              Manage your fleet - Station {stationId}
              {capacityInfo && (
                <span className="ml-2">
                  ({capacityInfo.current_count}/{capacityInfo.total_capacity} vehicles)
                </span>
              )}
              {vehicles.some(vehicle => vehicle.status === "charging") && (
                <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                  <span className="animate-pulse">🔋</span>
                  Auto-refreshing charging vehicles
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => {
              if (capacityInfo?.is_full) {
                alert("Station capacity is full. Please transfer vehicles to add new ones.");
                return;
              }
              setShowAddModal(true);
            }}
            className={`px-4 py-2 rounded-lg font-medium ${
              capacityInfo?.is_full 
                ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
            disabled={capacityInfo?.is_full}
          >
            {capacityInfo?.is_full ? "Capacity Full" : "Add Vehicle"}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Capacity Alert */}
        {capacityInfo?.is_full && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Station capacity is full!</strong> You have reached the maximum limit of {capacityInfo.total_capacity} vehicles. 
                  Transfer vehicles to other stations to free up space for new additions.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white shadow rounded-lg p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">🚗</div>
            <div>
              <p className="text-sm text-gray-500">Total Vehicles</p>
              <p className="text-2xl font-bold">{vehicles.length}</p>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">✅</div>
            <div>
              <p className="text-sm text-gray-500">Available</p>
              <p className="text-2xl font-bold text-green-600">
                {vehicles.filter(v => v.status === "available").length}
              </p>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center">🔋</div>
            <div>
              <p className="text-sm text-gray-500">Charging</p>
              <p className="text-2xl font-bold text-yellow-600">
                {vehicles.filter(v => v.status === "charging").length}
              </p>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">📊</div>
            <div>
              <p className="text-sm text-gray-500">Capacity Used</p>
              <p className="text-2xl font-bold">
                {capacityInfo ? `${Math.round((capacityInfo.current_count / capacityInfo.total_capacity) * 100)}%` : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by Vehicle ID, Number, Name..."
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
            <option value="available">Available</option>
            <option value="in_use">In Use</option>
            <option value="charging">Charging</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <select
            className="px-4 py-2 border rounded-lg"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="Scooter">Scooter</option>
            <option value="Bike">Bike</option>
            <option value="Car">Car</option>
            <option value="Auto">Auto</option>
          </select>
        </div>

        {/* Vehicle Cards */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading vehicles...</div>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No vehicles found</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map(vehicle => (
              <div key={vehicle.vehicle_id} className="bg-white shadow-lg rounded-xl p-6 hover:shadow-xl transition-shadow">
                {/* Vehicle Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getTypeIcon(vehicle.type)}</span>
                    <div>
                      <h3 className="font-bold text-gray-800">{vehicle.vehicle_id}</h3>
                      <p className="text-sm text-gray-500">{vehicle.vehicle_number}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(vehicle.status)} ${vehicle.status === 'charging' ? 'animate-pulse' : ''}`}>
                      {vehicle.status === 'charging' ? '🔋 Charging' : vehicle.status}
                    </span>
                    {/* Add quick status update dropdown */}
                    <select
                      className="text-xs border rounded px-2 py-1"
                      value={vehicle.status}
                      onChange={(e) => handleQuickStatusUpdate(vehicle, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="available">Available</option>
                      <option value="charging">Charging</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>
                </div>

                {/* Vehicle Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{vehicle.vehicle_name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Model:</span>
                    <span className="font-medium">{vehicle.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Battery:</span>
                    <span className={`font-bold ${getBatteryColor(vehicle.battery)} ${vehicle.status === 'charging' ? 'animate-pulse' : ''}`}>
                      {vehicle.status === 'charging' ? '⚡' : '🔋'} {vehicle.battery}%
                      {vehicle.status === 'charging' && (
                        <span className="ml-1 text-xs text-yellow-600">Charging...</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Odometer:</span>
                    <span className="font-medium">{vehicle.odometer_reading} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rate:</span>
                    <span className="font-medium">₹{vehicle.rental_rate?.per_km}/km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Service:</span>
                    <span className="font-medium">{formatDate(vehicle.last_service)}</span>
                  </div>
                </div>

                {/* Charging Port Info */}
                {vehicle.status === "charging" && vehicle.charging_port_info && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <h4 className="font-medium text-yellow-800 mb-2">⚡ Charging Details</h4>
                    <div className="text-sm text-yellow-700 space-y-1">
                      <div>Port: {vehicle.charging_port_info.port_id}</div>
                      <div>Type: {vehicle.charging_port_info.connector_type}</div>
                      <div>Power: {vehicle.charging_port_info.max_power_kw} kW</div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => openEditModal(vehicle)}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
                  >
                    ✏️ Edit
                  </button>
                  
                  {(capacityInfo?.is_full || vehicle.status === "available") && (
                    <button
                      onClick={() => openTransferModal(vehicle)}
                      className="flex-1 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition text-sm font-medium"
                      disabled={vehicle.status === "in_use" || vehicle.status === "charging"}
                    >
                      🔄 Transfer
                    </button>
                  )}
                  
                  {/* Add History button */}
                  <button
                    onClick={() => openHistoryModal(vehicle)}
                    className="px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition text-sm font-medium"
                  >
                    📋 History
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedVehicle(vehicle);
                      setShowDeleteModal(true);
                    }}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Add New Vehicle</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleAddVehicle} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle ID *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.vehicle_id}
                      onChange={e => setFormData({...formData, vehicle_id: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.vehicle_number}
                      onChange={e => setFormData({...formData, vehicle_number: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.vehicle_name}
                      onChange={e => setFormData({...formData, vehicle_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="">Select Type</option>
                      <option value="Scooter">Scooter</option>
                      <option value="Bike">Bike</option>
                      <option value="Car">Car</option>
                      <option value="Auto">Auto</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.model}
                      onChange={e => setFormData({...formData, model: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Battery %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.battery}
                      onChange={e => setFormData({...formData, battery: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Odometer Reading</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.odometer_reading}
                      onChange={e => setFormData({...formData, odometer_reading: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rate per KM</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.rental_rate.per_km}
                      onChange={e => setFormData({
                        ...formData, 
                        rental_rate: {...formData.rental_rate, per_km: e.target.value}
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rate per Hour</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.rental_rate.per_hour}
                      onChange={e => setFormData({
                        ...formData, 
                        rental_rate: {...formData.rental_rate, per_hour: e.target.value}
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Service Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.last_service}
                      onChange={e => setFormData({...formData, last_service: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Vehicle
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {showEditModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Edit Vehicle - {selectedVehicle.vehicle_id}</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedVehicle(null);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleEditVehicle} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.vehicle_number}
                      onChange={e => setFormData({...formData, vehicle_number: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.vehicle_name}
                      onChange={e => setFormData({...formData, vehicle_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="">Select Type</option>
                      <option value="Scooter">Scooter</option>
                      <option value="Bike">Bike</option>
                      <option value="Car">Car</option>
                      <option value="Auto">Auto</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.model}
                      onChange={e => setFormData({...formData, model: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Battery %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.battery}
                      onChange={e => setFormData({...formData, battery: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="available">Available</option>
                      <option value="in_use">In Use</option>
                      <option value="charging">Charging</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Odometer Reading</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.odometer_reading}
                      onChange={e => setFormData({...formData, odometer_reading: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rate per KM</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.rental_rate.per_km}
                      onChange={e => setFormData({
                        ...formData, 
                        rental_rate: {...formData.rental_rate, per_km: e.target.value}
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rate per Hour</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.rental_rate.per_hour}
                      onChange={e => setFormData({
                        ...formData, 
                        rental_rate: {...formData.rental_rate, per_hour: e.target.value}
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Service Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.last_service}
                      onChange={e => setFormData({...formData, last_service: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedVehicle(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Update Vehicle
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle History Modal */}
      {showHistoryModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Vehicle History - {selectedVehicle.vehicle_id}</h2>
                <button
                  onClick={() => {
                    setShowHistoryModal(false);
                    setSelectedVehicle(null);
                    setVehicleHistory([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              {historyLoading ? (
                <div className="text-center py-8">Loading history...</div>
              ) : vehicleHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No history available</div>
              ) : (
                <div className="space-y-4">
                  {vehicleHistory.map((record, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{record.action || "Status Change"}</h4>
                          <p className="text-sm text-gray-600">{record.description || "Vehicle status updated"}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(record.timestamp)}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusClass(record.status || "unknown")}`}>
                          {record.status || "N/A"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transfer Vehicle Modal */}
      {showTransferModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Transfer Vehicle</h2>
                <button
                  onClick={() => {
                    setShowTransferModal(false);
                    setSelectedVehicle(null);
                    setNearbyStations([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600 mb-2">Transfer <strong>{selectedVehicle.vehicle_id}</strong> to:</p>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {nearbyStations.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No stations with available capacity</p>
                ) : (
                  nearbyStations.map(station => (
                    <div
                      key={station.station_id}
                      className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleTransferVehicle(station.station_id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{station.station_name || station.station_id}</h4>
                          <p className="text-sm text-gray-500">{formatLocation(station.location)}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">
                            {station.available_capacity} slots
                          </div>
                          <div className="text-xs text-gray-500">
                            {station.current_vehicles}/{station.vehicle_capacity || 50}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="mt-6">
                <button
                  onClick={() => {
                    setShowTransferModal(false);
                    setSelectedVehicle(null);
                    setNearbyStations([]);
                  }}
                  className="w-full px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-red-600">Delete Vehicle</h2>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedVehicle(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete vehicle <strong>{selectedVehicle.vehicle_id}</strong>? 
                This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedVehicle(null);
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteVehicle}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
