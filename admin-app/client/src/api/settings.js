const API_BASE_URL = "http://localhost:8000";

export const fetchSettings = async (stationId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/settings/${stationId}/`);
    if (!res.ok) throw new Error("Failed to fetch settings");
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Fetch Settings Error:", err);
    return { status: "error", message: err.message };
  }
};

export const updateSettings = async (stationId, settings) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/settings/update/${stationId}/`, {
      method: "PUT", // REST convention for updates
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error("Failed to update settings");
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Update Settings Error:", err);
    return { status: "error", message: err.message };
  }
};

export const resetSettings = async (stationId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/settings/reset/${stationId}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to reset settings");
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Reset Settings Error:", err);
    return { status: "error", message: err.message };
  }
};
