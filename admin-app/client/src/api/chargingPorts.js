const API_BASE_URL = "http://127.0.0.1:8000/api/charging-ports";

export const fetchChargingPorts = async (stationId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${stationId}/`);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching charging ports:", error);
    return { status: "error", message: error.message, ports: [] };
  }
};

export const fetchAvailableVehicles = async (stationId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${stationId}/available-vehicles/`);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching available vehicles:", error);
    return { status: "error", message: error.message, vehicles: [] };
  }
};

export const assignVehicleToPort = async (stationId, portId, vehicleId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${stationId}/assign/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        port_id: portId,
        vehicle_id: vehicleId
      })
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error assigning vehicle to port:", error);
    return { status: "error", message: error.message };
  }
};

export const removeVehicleFromPort = async (stationId, portId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${stationId}/remove/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        port_id: portId
      })
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error removing vehicle from port:", error);
    return { status: "error", message: error.message };
  }
};
