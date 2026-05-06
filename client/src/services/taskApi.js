import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/tasks";
const PROJECT_API_BASE_URL = "http://localhost:5000/api/projects";
const tokenKey = "taskflow_token";
const userKey = "taskflow_user";

export const getStoredToken = () => localStorage.getItem(tokenKey);

export const setStoredToken = (token) => {
  localStorage.setItem(tokenKey, token);
};

export const clearStoredToken = () => {
  localStorage.removeItem(tokenKey);
};

export const getStoredUser = () => {
  const raw = localStorage.getItem(userKey);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

export const setStoredUser = (user) => {
  localStorage.setItem(userKey, JSON.stringify(user));
};

export const clearStoredUser = () => {
  localStorage.removeItem(userKey);
};

const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${getStoredToken()}`,
  },
});

export const getTasks = async (filters = {}) => {
  const response = await axios.get(API_BASE_URL, {
    ...getAuthConfig(),
    params: filters,
  });
  return response.data;
};

export const getProjects = async () => {
  const response = await axios.get(PROJECT_API_BASE_URL, getAuthConfig());
  return response.data;
};

export const createProject = async (payload) => {
  const response = await axios.post(PROJECT_API_BASE_URL, payload, getAuthConfig());
  return response.data;
};

export const addProjectMembers = async (projectId, members, memberEntries = []) => {
  const response = await axios.patch(
    `${PROJECT_API_BASE_URL}/${projectId}/members`,
    { memberUsernames: members, memberEntries },
    getAuthConfig()
  );
  return response.data;
};

export const removeProjectMember = async (projectId, username) => {
  const response = await axios.delete(
    `${PROJECT_API_BASE_URL}/${projectId}/members/${encodeURIComponent(username)}`,
    getAuthConfig()
  );
  return response.data;
};

export const createTask = async (payload) => {
  const response = await axios.post(API_BASE_URL, payload, getAuthConfig());
  return response.data;
};

export const updateTask = async (id, payload) => {
  const response = await axios.put(`${API_BASE_URL}/${id}`, payload, getAuthConfig());
  return response.data;
};

export const deleteTask = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/${id}`, getAuthConfig());
  return response.data;
};
