import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000'
});

// Attach token to every request if logged in
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (email: string, password: string) =>
    API.post('/auth/register', { email, password }),
  login: (email: string, password: string) =>
    API.post('/auth/login', { email, password })
};

export const stockAPI = {
  getStock: (ticker: string) =>
    API.get(`/stocks/${ticker}`)
};

export const councilAPI = {
  analyse: (userId: string, ticker: string, profile: object) =>
    API.post('/council/analyse', { userId, ticker, profile })
};

export default API;