// utils/api.js
import axios from 'axios';
import { API_BASE_URL } from '@env';

// For consistency, let's define API_URL just once
export const API_URL = API_BASE_URL;

//--------------------- Auth / User endpoints ---------------------
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

//--------------------- Matching & Swiping ---------------------
export const getPotentialMatches = (token, page = 0) =>
  axios.get(`${API_URL}/recommendations?skip=${page * 30}&limit=30`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const sendSwipe = (swipeeId, direction, token) => {
  return axios.post(
    `${API_URL}/swipe`,
    null,  // no body
    {
      params: { swipee_id: swipeeId, direction },
      headers: { Authorization: `Bearer ${token}` },
    }
  );
};

export const getMatches = (token) =>
  axios.get(`${API_URL}/matches`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const deleteMatch = (userId, token) => {
  return axios.delete(`${API_URL}/matches/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

//--------------------- Photo Uploads ---------------------
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

/** NEW: delete photo by ID */
export const deleteUserPhoto = (userId, photoId, token) =>
  axios.delete(`${API_URL}/users/${userId}/photos/${photoId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

/** Example: delete photo by URL if your server supports that */
export const deleteUserPhotoByUrl = (userId, photoUrl, token) => {
  return axios.delete(`${API_URL}/users/${userId}/photos-by-url`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { photo_url: photoUrl },
  });
};

//--------------------- Group Member endpoints ---------------------
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

export const updateGroupMember = (memberId, data, token) =>
  axios.put(`${API_URL}/group-members/${memberId}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });


export const createDuoProfile = (data, token) =>
  axios.post(`${API_URL}/duo-profile`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const updateDuoSharedProfile = (data, token) =>
  axios.put(`${API_URL}/me`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });


export const createGroupProfile = (data, token) =>
  axios.post(`${API_URL}/group-profile`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const switchProfileType = (newType, token) =>
  axios.put(`${API_URL}/profile-type`, { new_type: newType }, {
    headers: { Authorization: `Bearer ${token}` },
  });