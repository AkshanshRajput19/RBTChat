import axios from "axios";

// ✅ Use environment variable or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SERVER_ORIGIN = import.meta.env.VITE_SERVER_ORIGIN || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  try {
    const session = JSON.parse(localStorage.getItem("rbtchatSession"));
    if (session?.token) {
      config.headers.Authorization = `Bearer ${session.token}`;
    }
  } catch {
    localStorage.removeItem("rbtchatSession");
  }
  return config;
});

// ✅ This is what Chat.jsx is looking for!
export const getActiveServerOrigin = () => {
  return import.meta.env.VITE_SERVER_ORIGIN || "http://localhost:5000";
};

export default api;
export const UNAUTHORIZED_EVENT = 'unauthorized';