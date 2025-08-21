import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/profile'),
};

export const stationsAPI = {
  getAll: () => api.get('/stations'),
  getById: (id) => api.get(`/stations/${id}`),
};

export const vehiclesAPI = {
  getByStation: (stationId) => api.get(`/vehicles/station/${stationId}`),
  getById: (id) => api.get(`/vehicles/${id}`),
};

export const ridesAPI = {
  start: (vehicleId) => api.post('/rides/start', { vehicleId }),
  end: (rideId) => api.post(`/rides/${rideId}/end`),
  getHistory: () => api.get('/rides/history'),
};

export const sessionsAPI = {
  getActive: () => api.get('/sessions/active'),
  create: (sessionData) => api.post('/sessions', sessionData),
  update: (sessionId, data) => api.put(`/sessions/${sessionId}`, data),
  end: (sessionId) => api.post(`/sessions/${sessionId}/end`),
};

export const walletAPI = {
  getBalance: () => api.get('/wallet/balance'),
  addFunds: (amount) => api.post('/wallet/add-funds', { amount }),
  getTransactions: () => api.get('/wallet/transactions'),
};

export default api;
