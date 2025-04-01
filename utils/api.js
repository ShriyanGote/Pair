// utils/api.js
import axios from 'axios';

export const API_URL = 'http://localhost:8000';


export const register = (data) => axios.post(`${API_URL}/register`, data);
export const login = (data) => axios.post(`${API_URL}/login`, data);
export const getCurrentUser = (token) =>
  axios.get(`${API_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
export const updateUser = (id, data, token) =>
  axios.put(`${API_URL}/users/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });


export const getPotentialMatches = (token) =>
  axios.get(`${API_URL}/recommendations`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const sendSwipe = (swipeeId, direction, token) =>
  axios.post(`${API_URL}/swipe`, null, {
    params: { swipee_id: swipeeId, direction },
    headers: { Authorization: `Bearer ${token}` },
  });
