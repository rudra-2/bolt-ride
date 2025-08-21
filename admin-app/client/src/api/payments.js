const API_BASE_URL = "http://127.0.0.1:8000/api/payments";

export const paymentsAPI = {
  getPaymentsByStation: async (stationId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${stationId}/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching payments by station:", error);
      return { status: "error", message: error.message, payments: [] };
    }
  },

  getAllPayments: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching all payments:", error);
      return { status: "error", message: error.message, payments: [] };
    }
  },
};
