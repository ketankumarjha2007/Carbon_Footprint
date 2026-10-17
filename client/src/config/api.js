// Dynamic API Base URL configuration
const getApiBaseUrl = () => {
  // If explicitly configured via Vite env, use it
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // If running on localhost in browser, default to local backend on 5000
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:5000";
  }
  // Production fallback to Render
  return "https://carbon-footprint-1-a5ae.onrender.com";
};

export const API_BASE_URL = getApiBaseUrl();
export default API_BASE_URL;
