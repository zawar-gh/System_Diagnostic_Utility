//src/api/axiosConfig.ts
import axios from "axios";

export const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api",
});

// Automatically attach JWT from localStorage for all requests
API.interceptors.request.use((config) => {
  const stored = localStorage.getItem("sdu_user");
  if (stored) {
    const { access } = JSON.parse(stored);
    if (access) config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Optional: handle 401 globally
    if (error.response?.status === 401) {
      console.warn("Unauthorized! JWT may be invalid or expired.");
      // Optional: trigger logout or redirect to login
    }
    return Promise.reject(error);
  }
);

export default API;
