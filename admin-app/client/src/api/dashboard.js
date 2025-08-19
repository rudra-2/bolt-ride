const API_BASE = "http://127.0.0.1:8000/api/dashboard";

async function handleResponse(response) {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function fetchStationSummary(stationId) {
  try {
    const res = await fetch(`${API_BASE}/stats/${stationId}/`);
    return await handleResponse(res);
  } catch (error) {
    console.error('Error fetching station summary:', error);
    return { status: 'error', message: error.message };
  }
}

export async function fetchActiveRides(stationId) {
  try {
    const res = await fetch(`${API_BASE}/active_rides/${stationId}/`);
    return await handleResponse(res);
  } catch (error) {
    console.error('Error fetching active rides:', error);
    return { status: 'error', message: error.message };
  }
}

export async function fetchVehiclesLite(stationId) {
  try {
    const res = await fetch(`${API_BASE}/vehicles/${stationId}/`);
    return await handleResponse(res);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return { status: 'error', message: error.message };
  }
}

export async function fetchStationDetails(stationId) {
  try {
    const res = await fetch(`${API_BASE}/station/${stationId}/`);
    return await handleResponse(res);
  } catch (error) {
    console.error('Error fetching station details:', error);
    return { status: 'error', message: error.message };
  }
}