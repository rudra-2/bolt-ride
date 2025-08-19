// src/api/vehicles.js

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api"

// Test connection function
export const testConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/test/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error testing connection:", error);
    return { status: "error", message: error.message };
  }
};

export const loginStationManager = async (email, password) => {
  try {
    console.log("Making login request to:", `${API_BASE_URL}/auth/login/`);
    const res = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ email, password }),
    });
    
    console.log("Login response status:", res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Login error response:", errorText);
      throw new Error(`HTTP error! status: ${res.status} - ${errorText}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error("Error in loginStationManager:", error);
    return { status: "error", message: error.message };
  }
};

// Keep old loginStation for backward compatibility
export const loginStation = async (station_id, password) => {
  try {
    console.log("Making login request to:", `${API_BASE_URL}/station-login/`);
    const res = await fetch(`${API_BASE_URL}/station-login/`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ station_id, password }),
    });
    
    console.log("Login response status:", res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Login error response:", errorText);
      throw new Error(`HTTP error! status: ${res.status} - ${errorText}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error("Error in loginStation:", error);
    return { status: "error", message: error.message };
  }
};

export const fetchVehicles = async (stationId) => {
  try {
    console.log("Fetching vehicles from:", `${API_BASE_URL}/vehicles/${stationId}/`);
    const response = await fetch(`${API_BASE_URL}/vehicles/${stationId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log("Fetch vehicles response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Fetch vehicles error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Non-JSON response:", text);
      throw new Error("Server returned non-JSON response");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return { 
      status: "error", 
      message: `Failed to fetch vehicles: ${error.message}. Please check if the server is running on ${API_BASE_URL}`
    };
  }
}

export const addVehicle = async (vehicleData) => {
  try {
    console.log("Adding vehicle to:", `${API_BASE_URL}/vehicles/add/`);
    console.log("Vehicle data:", vehicleData);
    
    const response = await fetch(`${API_BASE_URL}/vehicles/add/`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(vehicleData),
    });
    
    console.log("Add vehicle response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Add vehicle error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error adding vehicle:", error);
    return { status: "error", message: error.message };
  }
}

export const updateVehicle = async (vehicleId, updateData) => {
  try {
    console.log("Updating vehicle:", `${API_BASE_URL}/vehicles/update/${vehicleId}/`);
    console.log("Update data:", updateData);
    
    const response = await fetch(`${API_BASE_URL}/vehicles/update/${vehicleId}/`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(updateData),
    });
    
    console.log("Update vehicle response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Update vehicle error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error updating vehicle:", error);
    return { status: "error", message: error.message };
  }
}

export const deleteVehicle = async (vehicleId) => {
  try {
    console.log("Deleting vehicle:", `${API_BASE_URL}/vehicles/delete/${vehicleId}/`);
    
    const response = await fetch(`${API_BASE_URL}/vehicles/delete/${vehicleId}/`, {
      method: "DELETE",
      headers: {
        "Accept": "application/json"
      }
    });
    
    console.log("Delete vehicle response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Delete vehicle error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    return { status: "error", message: error.message };
  }
}

export const getVehicleDetails = async (vehicleId) => {
  try {
    console.log("Fetching vehicle details:", `${API_BASE_URL}/vehicles/details/${vehicleId}/`);
    
    const response = await fetch(`${API_BASE_URL}/vehicles/details/${vehicleId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log("Vehicle details response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Vehicle details error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching vehicle details:", error);
    return { status: "error", message: error.message };
  }
}

export const getNearbyStations = async (stationId) => {
  try {
    console.log("Fetching nearby stations:", `${API_BASE_URL}/nearby-stations/${stationId}/`);
    
    const response = await fetch(`${API_BASE_URL}/nearby-stations/${stationId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log("Nearby stations response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Nearby stations error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching nearby stations:", error);
    return { status: "error", message: error.message };
  }
}

export const transferVehicle = async (vehicleId, sourceStationId, targetStationId) => {
  try {
    console.log("Transferring vehicle:", `${API_BASE_URL}/vehicles/transfer/`);
    console.log("Transfer data:", { vehicleId, sourceStationId, targetStationId });
    
    const response = await fetch(`${API_BASE_URL}/vehicles/transfer/`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        vehicle_id: vehicleId,
        source_station_id: sourceStationId,
        target_station_id: targetStationId
      }),
    });
    
    console.log("Transfer vehicle response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Transfer vehicle error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error transferring vehicle:", error);
    return { status: "error", message: error.message };
  }
}

// Additional utility functions

export const getStationDetails = async (stationId) => {
  try {
    console.log("Fetching station details:", `${API_BASE_URL}/stations/${stationId}/`);
    
    const response = await fetch(`${API_BASE_URL}/stations/${stationId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log("Station details response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Station details error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching station details:", error);
    return { status: "error", message: error.message };
  }
}

export const updateVehicleStatus = async (vehicleId, status, additionalData = {}) => {
  try {
    console.log("Updating vehicle status:", `${API_BASE_URL}/vehicles/update-status/${vehicleId}/`);
    console.log("Status update data:", { status, ...additionalData });
    
    const response = await fetch(`${API_BASE_URL}/vehicles/update-status/${vehicleId}/`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        status,
        ...additionalData,
        updated_at: new Date().toISOString()
      }),
    });
    
    console.log("Update status response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Update status error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error updating vehicle status:", error);
    return { status: "error", message: error.message };
  }
}

export const bulkUpdateVehicles = async (vehicles) => {
  try {
    console.log("Bulk updating vehicles:", `${API_BASE_URL}/vehicles/bulk-update/`);
    console.log("Bulk update data:", vehicles);
    
    const response = await fetch(`${API_BASE_URL}/vehicles/bulk-update/`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ vehicles }),
    });
    
    console.log("Bulk update response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Bulk update error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error bulk updating vehicles:", error);
    return { status: "error", message: error.message };
  }
}

export const getVehicleHistory = async (vehicleId) => {
  try {
    console.log("Fetching vehicle history:", `${API_BASE_URL}/vehicles/history/${vehicleId}/`);
    
    const response = await fetch(`${API_BASE_URL}/vehicles/history/${vehicleId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log("Vehicle history response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Vehicle history error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching vehicle history:", error);
    return { status: "error", message: error.message };
  }
}

export const searchVehicles = async (searchParams) => {
  try {
    const queryString = new URLSearchParams(searchParams).toString();
    console.log("Searching vehicles:", `${API_BASE_URL}/vehicles/search/?${queryString}`);
    
    const response = await fetch(`${API_BASE_URL}/vehicles/search/?${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log("Search vehicles response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Search vehicles error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error searching vehicles:", error);
    return { status: "error", message: error.message };
  }
}

export const exportVehicles = async (stationId, format = 'csv') => {
  try {
    console.log("Exporting vehicles:", `${API_BASE_URL}/vehicles/export/${stationId}/?format=${format}`);
    
    const response = await fetch(`${API_BASE_URL}/vehicles/export/${stationId}/?format=${format}`, {
      method: 'GET',
      headers: {
        'Accept': format === 'csv' ? 'text/csv' : 'application/json'
      }
    });
    
    console.log("Export vehicles response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Export vehicles error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    if (format === 'csv') {
      return await response.text();
    } else {
      return await response.json();
    }
  } catch (error) {
    console.error("Error exporting vehicles:", error);
    return { status: "error", message: error.message };
  }
}

export const importVehicles = async (stationId, vehiclesData) => {
  try {
    console.log("Importing vehicles:", `${API_BASE_URL}/vehicles/import/${stationId}/`);
    console.log("Import data:", vehiclesData);
    
    const response = await fetch(`${API_BASE_URL}/vehicles/import/${stationId}/`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ vehicles: vehiclesData }),
    });
    
    console.log("Import vehicles response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Import vehicles error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error importing vehicles:", error);
    return { status: "error", message: error.message };
  }
}

// Maintenance related functions
export const scheduleMaintenence = async (vehicleId, maintenanceData) => {
  try {
    console.log("Scheduling maintenance:", `${API_BASE_URL}/vehicles/maintenance/schedule/${vehicleId}/`);
    console.log("Maintenance data:", maintenanceData);
    
    const response = await fetch(`${API_BASE_URL}/vehicles/maintenance/schedule/${vehicleId}/`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(maintenanceData),
    });
    
    console.log("Schedule maintenance response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Schedule maintenance error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error scheduling maintenance:", error);
    return { status: "error", message: error.message };
  }
}

export const getMaintenanceHistory = async (vehicleId) => {
  try {
    console.log("Fetching maintenance history:", `${API_BASE_URL}/vehicles/maintenance/history/${vehicleId}/`);
    
    const response = await fetch(`${API_BASE_URL}/vehicles/maintenance/history/${vehicleId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log("Maintenance history response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Maintenance history error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching maintenance history:", error);
    return { status: "error", message: error.message };
  }
}

// Analytics functions
export const getVehicleAnalytics = async (stationId, timeRange = '7days') => {
  try {
    console.log("Fetching vehicle analytics:", `${API_BASE_URL}/vehicles/analytics/${stationId}/?range=${timeRange}`);
    
    const response = await fetch(`${API_BASE_URL}/vehicles/analytics/${stationId}/?range=${timeRange}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log("Vehicle analytics response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Vehicle analytics error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching vehicle analytics:", error);
    return { status: "error", message: error.message };
  }
}

// Error handling helper
export const handleApiError = (error) => {
  console.error("API Error:", error);
  
  if (error.message.includes('fetch')) {
    return {
      status: "error",
      message: "Network error. Please check your internet connection and server status.",
      type: "network"
    };
  }
  
  if (error.message.includes('405')) {
    return {
      status: "error",
      message: "Method not allowed. Please check API endpoint configuration.",
      type: "method"
    };
  }
  
  if (error.message.includes('404')) {
    return {
      status: "error",
      message: "Resource not found. Please check the URL or contact support.",
      type: "notfound"
    };
  }
  
  if (error.message.includes('500')) {
    return {
      status: "error",
      message: "Server error. Please try again later or contact support.",
      type: "server"
    };
  }
  
  return {
    status: "error",
    message: error.message || "An unexpected error occurred.",
    type: "unknown"
  };
};

// Connection test helper
export const checkApiConnection = async () => {
  try {
    const result = await testConnection();
    if (result.status === "success") {
      console.log("✅ API connection successful");
      return true;
    } else {
      console.error("❌ API connection failed:", result.message);
      return false;
    }
  } catch (error) {
    console.error("❌ API connection test failed:", error);
    return false;
  }
};

// Create the API object and assign to variable before exporting
const vehicleApi = {
  testConnection,
  loginStation,
  fetchVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleDetails,
  getNearbyStations,
  transferVehicle,
  getStationDetails,
  updateVehicleStatus,
  bulkUpdateVehicles,
  getVehicleHistory,
  searchVehicles,
  exportVehicles,
  importVehicles,
  scheduleMaintenence,
  getMaintenanceHistory,
  getVehicleAnalytics,
  handleApiError,
  checkApiConnection
};

// Export as default
export default vehicleApi;
