import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
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

export default api;
