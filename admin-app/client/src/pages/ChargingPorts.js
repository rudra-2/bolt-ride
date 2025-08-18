import React, { useState, useEffect } from "react";
import { 
  fetchChargingPorts, 
  fetchAvailableVehicles, 
  assignVehicleToPort, 
  removeVehicleFromPort 
} from "../api/chargingPorts";
import { useParams, useNavigate } from "react-router-dom";

export default function ChargingPorts() {
  const { stationId } = useParams();
  const navigate = useNavigate();
  const [ports, setPorts] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPort, setSelectedPort] = useState(null);
  const [assigningVehicle, setAssigningVehicle] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!stationId) return;
      
      setLoading(true);
      setError(null);
      
      const [portsData, vehiclesData] = await Promise.all([
        fetchChargingPorts(stationId),
        fetchAvailableVehicles(stationId)
      ]);
      
      if (portsData.status === "success") {
        setPorts(portsData.ports || []);
      } else {
        setError(portsData.message || "Failed to fetch charging ports");
      }

      if (vehiclesData.status === "success") {
        setAvailableVehicles(vehiclesData.vehicles || []);
      }
      
      setLoading(false);
    };
    
    loadData();
  }, [stationId]);

  const filteredPorts = ports.filter((port) => {
    const matchesSearch =
      (port.port_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (port.connector_type || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || port.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusClass = (status) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800";
      case "occupied": return "bg-blue-100 text-blue-800";
      case "maintenance": return "bg-red-100 text-red-800";
      case "offline": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "available": return "🟢";
      case "occupied": return "🔵";
      case "maintenance": return "🔴";
      case "offline": return "⚫";
      default: return "❓";
    }
  };

  const handleAssignVehicle = (port) => {
    setSelectedPort(port);
    setShowAssignModal(true);
  };

  const handleVehicleAssignment = async (vehicleId) => {
    if (!selectedPort || !vehicleId) return;
    
    setAssigningVehicle(true);
    
    const result = await assignVehicleToPort(stationId, selectedPort.port_id, vehicleId);
    
    if (result.status === "success") {
      // Refresh data
      const [portsData, vehiclesData] = await Promise.all([
        fetchChargingPorts(stationId),
        fetchAvailableVehicles(stationId)
      ]);
      
      if (portsData.status === "success") setPorts(portsData.ports || []);
      if (vehiclesData.status === "success") setAvailableVehicles(vehiclesData.vehicles || []);
      
      setShowAssignModal(false);
      setSelectedPort(null);
    } else {
      alert(result.message || "Failed to assign vehicle");
    }
    
    setAssigningVehicle(false);
  };

  const handleRemoveVehicleClick = (port) => {
    setSelectedPort(port);
    setShowConfirmModal(true);
  };

  const handleConfirmRemoveVehicle = async () => {
    if (!selectedPort) return;
    
    const result = await removeVehicleFromPort(stationId, selectedPort.port_id);
    
    if (result.status === "success") {
      // Refresh data
      const [portsData, vehiclesData] = await Promise.all([
        fetchChargingPorts(stationId),
        fetchAvailableVehicles(stationId)
      ]);
      
      if (portsData.status === "success") setPorts(portsData.ports || []);
      if (vehiclesData.status === "success") setAvailableVehicles(vehiclesData.vehicles || []);
      
      setShowConfirmModal(false);
      setSelectedPort(null);
    } else {
      alert(result.message || "Failed to remove vehicle");
    }
  };

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Error Loading Charging Ports</h2>
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
            <h1 className="text-2xl font-bold text-gray-800">Charging Ports Management</h1>
            <p className="text-sm text-gray-500">Monitor and manage charging infrastructure - Station {stationId}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white shadow rounded-lg p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">⚡</div>
            <div>
              <p className="text-sm text-gray-500">Total Ports</p>
              <p className="text-2xl font-bold">{ports.length}</p>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">🟢</div>
            <div>
              <p className="text-sm text-gray-500">Available</p>
              <p className="text-2xl font-bold text-green-600">{ports.filter(p => p.status === "available").length}</p>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">🔵</div>
            <div>
              <p className="text-sm text-gray-500">Occupied</p>
              <p className="text-2xl font-bold text-blue-600">{ports.filter(p => p.status === "occupied").length}</p>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center">🚗</div>
            <div>
              <p className="text-sm text-gray-500">Available Vehicles</p>
              <p className="text-2xl font-bold">{availableVehicles.length}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by Port ID, Connector Type..."
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
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
            <option value="offline">Offline</option>
          </select>
        </div>

        {/* Ports Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading charging ports...</div>
          </div>
        ) : filteredPorts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No charging ports found</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPorts.map(port => (
              <div key={port.port_id} className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                      <span className="text-blue-600">⚡</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{port.port_id}</h3>
                      <p className="text-sm text-gray-500">{port.connector_type}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusClass(port.status)} flex items-center gap-1`}>
                    {getStatusIcon(port.status)} {port.status}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Max Power:</span>
                    <span className="font-medium">{port.max_power_kw} kW</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Usage Count:</span>
                    <span className="font-medium">{port.usage_count}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Current Vehicle:</span>
                    <span className="font-medium text-sm">
                      {port.current_vehicle_id || "None"}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Last Service:</span>
                    <span className="font-medium text-sm">{port.last_service}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  {port.status === "available" ? (
                    <button 
                      onClick={() => handleAssignVehicle(port)}
                      className="w-full px-3 py-2 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100 transition"
                      disabled={availableVehicles.length === 0}
                    >
                      {availableVehicles.length === 0 ? "No Vehicles Available" : "Assign Vehicle"}
                    </button>
                  ) : port.status === "occupied" ? (
                    <button 
                      onClick={() => handleRemoveVehicleClick(port)}
                      className="w-full px-3 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                    >
                      Remove Vehicle
                    </button>
                  ) : (
                    <button className="w-full px-3 py-2 text-sm bg-gray-50 text-gray-400 rounded cursor-not-allowed">
                      {port.status === "maintenance" ? "Under Maintenance" : "Offline"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Assign Vehicle Modal */}
      {showAssignModal && selectedPort && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Assign Vehicle to {selectedPort.port_id}
            </h3>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {availableVehicles.length === 0 ? (
                <p className="text-gray-500">No available vehicles</p>
              ) : (
                availableVehicles.map(vehicle => (
                  <div 
                    key={vehicle.vehicle_id}
                    className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleVehicleAssignment(vehicle.vehicle_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{vehicle.vehicle_id}</h4>
                        <p className="text-sm text-gray-500">
                          {vehicle.vehicle_number} • {vehicle.type}
                        </p>
                        <p className="text-sm text-gray-500">
                          {vehicle.vehicle_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-green-600">
                          🔋 {vehicle.battery || 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedPort(null);
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                disabled={assigningVehicle}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Remove Vehicle Modal */}
      {showConfirmModal && selectedPort && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Removal</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove vehicle <strong>{selectedPort.current_vehicle_id}</strong> from port <strong>{selectedPort.port_id}</strong>?
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedPort(null);
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemoveVehicle}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Remove Vehicle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
