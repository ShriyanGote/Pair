// utils/api.js
import axios from 'axios';

export const API_URL = 'http://192.168.87.48:8000'; // <-- your FastAPI IP

export const register = (data) => axios.post(`${API_URL}/register`, data);
export const login = (data) => axios.post(`${API_URL}/login`, data);
export const getCurrentUser = (token) =>
  axios.get(`${API_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
