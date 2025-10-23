//authService.ts
import API from "../api/axiosConfig";

export const signupUser = async (data: { username: string; email: string; password: string }) => {
  const res = await API.post("/users/signup/", data);
  return res.data;
};

export const loginUser = async (credentials: { username: string; password: string }) => {
  const res = await API.post("/users/login/", credentials);
  return res.data; // { access, refresh }
};

export const refreshToken = async (refresh: string) => {
  const res = await API.post("/users/refresh/", { refresh });
  return res.data;
};

export const getProfile = async () => {
  const res = await API.get("/users/profile/");
  return res.data;
};
