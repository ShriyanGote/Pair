// utils/api.js
import axios from 'axios';
import { API_BASE_URL } from '@env';

export const API_URL = API_BASE_URL;


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

export const sendSwipe = (swipeeId, direction, token) => {
  console.log(`[API] Sending swipe: ${direction} on ID: ${swipeeId}`);
  return axios.post(`${API_URL}/swipe`, null, {
    params: { swipee_id: swipeeId, direction },
    headers: { Authorization: `Bearer ${token}` },
  });
};


export const getMatches = (token) =>
  axios.get(`${API_URL}/matches`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const uploadProfilePhoto = (formData, token) =>
  axios.post(`${API_URL}/upload-profile-photo`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
