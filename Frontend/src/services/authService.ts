import {API} from "../api/axiosConfig";

export const signupUser = async (data: {
  username: string;
  email: string;
  password: string;
}) => {
  const res = await API.post("/users/signup/", data);
  return res.data;
};

export const loginUser = async (credentials: {
  username: string;
  password: string;
}) => {
  const res = await API.post("/users/login/", credentials);
  // Store tokens
  localStorage.setItem("sdu_user", JSON.stringify(res.data));
  return res.data; // { access, refresh }
};

export const refreshToken = async (refresh: string) => {
  const res = await API.post("/users/refresh/", { refresh });
  return res.data; // { access }
};

export const getProfile = async () => {
  const res = await API.get("/users/profile/");
  return res.data;
};

export const logoutUser = () => {
  localStorage.removeItem("sdu_user");
  window.location.href = "/login";
};
