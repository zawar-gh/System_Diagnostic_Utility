//axiosConfig.ts
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api",
});

API.interceptors.request.use((config) => {
  const stored = localStorage.getItem("sdu_user");
  if (stored) {
    const { access } = JSON.parse(stored);
    if (access) config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

export default API;
