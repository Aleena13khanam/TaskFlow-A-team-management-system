import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/auth";

export const registerUser = async (payload) => {
  const response = await axios.post(`${API_BASE_URL}/register`, payload);
  return response.data;
};

export const loginUser = async (payload) => {
  const response = await axios.post(`${API_BASE_URL}/login`, payload);
  return response.data;
};

export const getCurrentUser = async (token) => {
  const response = await axios.get(`${API_BASE_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const updateCurrentUser = async (token, payload) => {
  const response = await axios.patch(`${API_BASE_URL}/me`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
