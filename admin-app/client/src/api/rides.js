const API_BASE_URL = "http://127.0.0.1:8000/api/rides";

export const fetchRides = async (station_id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${station_id}/`);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching rides:", error);
    return { status: "error", message: error.message, rides: [] };
  }
};
