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

  // Make sure deleteMatch is actually defined and exported:
export const deleteMatch = async (userId, token) => {
  return axios.delete(`${API_BASE_URL}/matches/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const uploadProfilePhoto = (formData, token) =>
  axios.post(`${API_URL}/upload-profile-photo`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });


/** NEW: fetch user photos */
export const getUserPhotos = (userId, token) =>
  axios.get(`${API_URL}/users/${userId}/photos`, {
    headers: { Authorization: `Bearer ${token}` },
  });

/** NEW: upload multiple photos for UNO */
export const uploadUnoPhoto = (formData, token) =>
  axios.post(`${API_URL}/upload-uno-photo`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });

/** NEW: delete photo if you want a removal feature */
export const deleteUserPhoto = (userId, photoId, token) =>
  axios.delete(`${API_URL}/users/${userId}/photos/${photoId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });



export const deleteUserPhotoByUrl = (userId, photoUrl, token) => {
    return axios.delete(`${API_URL}/users/${userId}/photos-by-url`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { photo_url: photoUrl },
    });
};


export const getGroupMemberPhotos = (memberId, token) =>
  axios.get(`${API_URL}/group-members/${memberId}/photos`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const uploadGroupMemberPhoto = (memberId, formData, token) =>
  axios.post(`${API_URL}/group-members/${memberId}/photos`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });

export const deleteGroupMemberPhoto = (memberId, photoId, token) =>
  axios.delete(`${API_URL}/group-members/${memberId}/photos/${photoId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });