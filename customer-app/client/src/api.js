// import axios from "axios";

// const API = axios.create({
//   baseURL: "http://localhost:5000/api",
// });

// // Automatically attach token
// API.interceptors.request.use((req) => {
//   const token = localStorage.getItem("token");
//   if (token) req.headers.Authorization = `Bearer ${token}`;
//   return req;
// });

// export default API;
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => API.post('/auth/login', credentials),
  register: (userData) => API.post('/auth/register', userData),
  getProfile: () => API.get('/profile'),
};

export const stationsAPI = {
  getAll: () => API.get('/stations'),
  getNearby: (lat, lng) => API.get(`/stations/nearby?lat=${lat}&lng=${lng}`),
  getById: (id) => API.get(`/stations/${id}`),
  getVehicles: (stationId) => API.get(`/stations/${stationId}/vehicles`),
};

export const vehiclesAPI = {
  getByStation: (stationId) => API.get(`/stations/${stationId}/vehicles`),
  getById: (id) => API.get(`/vehicles/${id}`),
  scan: (qrCode) => API.post('/vehicles/scan', { qr_code: qrCode }),
  checkAvailability: (vehicleId, stationId) => API.post(`/vehicles/${vehicleId}/availability`, { stationId }),
  getDetails: (vehicleId) => API.get(`/vehicles/${vehicleId}`),
};

export const ridesAPI = {
  start: (data) => API.post('/rides/start', data),
  end: (data) => API.post('/rides/end', data),
  getHistory: () => API.get('/rides/history'),
  getById: (id) => API.get(`/rides/${id}`),
  sendAlert: (data) => API.post('/rides/alert', data),
};

// Helper functions for components
export const getProfile = () => authAPI.getProfile();
export const getWalletBalance = () => walletAPI.getBalance();
export const getNearbyStations = (lat, lng) => stationsAPI.getNearby(lat, lng);
export const getVehicleDetails = (vehicleId) => vehiclesAPI.getDetails(vehicleId);
export const getVehicleByQR = (qrCode) => vehiclesAPI.scan(qrCode);
export const startRide = (data) => ridesAPI.start(data);
export const endRide = (data) => ridesAPI.end(data);
export const updateWalletBalance = (amount) => walletAPI.addMoney(amount);

export const sessionsAPI = {
  getActive: () => API.get('/sessions/active'),
  create: (sessionData) => API.post('/sessions', sessionData),
  update: (sessionId, data) => API.put(`/sessions/${sessionId}`, data),
  end: (sessionId) => API.post(`/sessions/${sessionId}/end`),
};

export const walletAPI = {
  getBalance: () => API.get('/wallet/balance'),
  addMoney: (amount) => API.post('/wallet/add', { amount }),
  getTransactions: () => API.get('/wallet/transactions'),
};

export const passesAPI = {
  buy: (passType) => API.post('/passes/buy', { pass_type: passType }),
  getCurrent: () => API.get('/passes'),
  getHistory: () => API.get('/passes/history'),
};

export default API;