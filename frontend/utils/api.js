// utils/api.js
import axios from 'axios';
import { API_BASE_URL } from '@env';

// Base URL
export const API_URL = API_BASE_URL;

//--------------------- Auth / User endpoints ---------------------
export const register = (data) => axios.post(`${API_URL}/register`, data);
export const login = (data) => axios.post(`${API_URL}/login`, data);
export const getCurrentUser = (token) =>
  axios.get(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } });
export const updateUser = (id, data, token) =>
  axios.put(`${API_URL}/users/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

//--------------------- Matching & Swiping ---------------------
export const getPotentialMatches = (token, page = 0) =>
  axios.get(`${API_URL}/recommendations?skip=${page * 30}&limit=30`, {
    headers: { Authorization: `Bearer ${token}` },
  });
export const sendSwipe = (swipeeId, direction, token) =>
  axios.post(
    `${API_URL}/swipe`,null, { params: { swipee_id: swipeeId, direction }, headers: { Authorization: `Bearer ${token}` } });
export const getMatches = (token) =>
  axios.get(`${API_URL}/matches`, { headers: { Authorization: `Bearer ${token}` } });
export const deleteMatch = (userId, token) =>
  axios.delete(`${API_URL}/matches/${userId}`, { headers: { Authorization: `Bearer ${token}` } });

//--------------------- Photo Uploads ---------------------
export const uploadProfilePhoto = (formData, token) =>
  axios.post(`${API_URL}/upload-profile-photo`, formData, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
  });
export const getUserPhotos = (userId, token) =>
  axios.get(`${API_URL}/users/${userId}/photos`, { headers: { Authorization: `Bearer ${token}` } });
export const uploadUnoPhoto = (formData, token) =>
  axios.post(`${API_URL}/upload-uno-photo`, formData, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
  });
export const deleteUserPhoto = (userId, photoId, token) =>
  axios.delete(`${API_URL}/users/${userId}/photos/${photoId}`, { headers: { Authorization: `Bearer ${token}` } });
export const deleteUserPhotoByUrl = (userId, photoUrl, token) =>
  axios.delete(`${API_URL}/users/${userId}/photos-by-url`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { photo_url: photoUrl },
  });

//--------------------- Duo Member endpoints ---------------------
export const getDuoMembers = (token) =>
  axios.get(`${API_URL}/duo-members`, { headers: { Authorization: `Bearer ${token}` } });

export const addDuoMember = (data, token) =>
  axios.post( `${API_URL}/duo-members`,data, { headers: { Authorization: `Bearer ${token}` } });

export const deleteDuoMember = (memberId, token) =>
  axios.delete(`${API_URL}/duo-members/${memberId}`, { headers: { Authorization: `Bearer ${token}` }});

export const getDuoMemberPhotos = (memberId, token) =>
  axios.get(`${API_URL}/duo-members/${memberId}/photos`, { headers: { Authorization: `Bearer ${token}` } });

export const uploadDuoMemberPhoto = (memberId, formData, token) =>
  axios.post(`${API_URL}/duo-members/${memberId}/photos`, formData, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
  });

export const deleteDuoMemberPhoto = (memberId, photoId, token) =>
  axios.delete(`${API_URL}/duo-members/${memberId}/photos/${photoId}`, { headers: { Authorization: `Bearer ${token}` } });

export const updateDuoMember = (memberId, data, token) =>
  axios.put(`${API_URL}/duo-members/${memberId}`, data, { headers: { Authorization: `Bearer ${token}` } });





//--------------------- Group Member endpoints ---------------------
export const getGroupMembers = (token) =>
  axios.get(`${API_URL}/group-members`, { headers: { Authorization: `Bearer ${token}` } });

export const deleteGroupMember = (memberId, token) =>
  axios.delete(`${API_URL}/group-members/${memberId}`, { headers: { Authorization: `Bearer ${token}` } });

export const getGroupMemberPhotos = (memberId, token) =>
  axios.get(`${API_URL}/group-members/${memberId}/photos`, { headers: { Authorization: `Bearer ${token}` } });


export const updateGroupMember = (memberId, data, token) =>
  axios.put(
    `${API_URL}/group-members/${memberId}`,
    data,
    { headers: { Authorization: `Bearer ${token}` } }
  );


// ---------------------------- Requests --------------------------------------------------------------------

export const getIncomingRequests = (token) =>
  axios.get(`${API_URL}/incoming-requests`, {
    headers: { Authorization: `Bearer ${token}` },
  });