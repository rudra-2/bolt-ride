const API_BASE_URL = "http://127.0.0.1:8000/api/reports";

export const fetchReports = async (stationId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${stationId}/`);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error fetching reports:", err);
    return { status: "error", message: err.message, report: null };
  }
};
