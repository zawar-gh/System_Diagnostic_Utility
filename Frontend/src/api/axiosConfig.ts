import axios from "axios";

// ✅ Named export instead of default
export const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api",
  withCredentials: true, // required if CORS_ALLOW_CREDENTIALS = True
});

// Attach JWT to every request
API.interceptors.request.use((config) => {
  const stored = localStorage.getItem("sdu_user");
  if (stored) {
    const { access } = JSON.parse(stored);
    if (access) config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// Auto-refresh JWT on 401
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const stored = localStorage.getItem("sdu_user");
      if (stored) {
        try {
          const { refresh } = JSON.parse(stored);
          const refreshRes = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"}/users/refresh/`,
            { refresh }
          );

          const newAccess = refreshRes.data.access;
          localStorage.setItem(
            "sdu_user",
            JSON.stringify({ access: newAccess, refresh })
          );

          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return axios(originalRequest);
        } catch (err) {
          console.error("Refresh token failed. Logging out...");
          localStorage.removeItem("sdu_user");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// ❌ Remove default export
// export default API;
