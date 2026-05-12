import axios from "axios";

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = import.meta.env.VITE_API_BASE_URL || (isLocal ? "http://localhost:5000" : window.location.origin);
const API_URL = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;

// Agar hum localhost par hain aur url mein /api nahi hai, toh hum manually '/api' add kar sakte hain
// Lekin product/image urls ke liye humein dhayan rakhna hoga.
export const API_BASE_URL = API_URL;

const API = axios.create({
  // Agar API_URL mein pehle se /api hai toh wahi use karein, warna /api add karein
  baseURL: API_URL.endsWith("/api") ? API_URL : `${API_URL}/api`,
});

export const getImageUrl = (url) => {
  if (!url) return "";

  // Handle absolute URLs or data URLs
  if (url.startsWith("http") || url.startsWith("data:image")) return url;

  // Handle cases where absolute localhost URLs might be stored in the database
  if (url.includes('localhost:5000') || url.includes('127.0.0.1:5000')) {
    const parts = url.split('/uploads/');
    if (parts.length > 1) {
      url = '/uploads/' + parts[1];
    }
  }

  // Ensure path starts correctly
  let cleanUrl = url;
  
  // If it's a raw filename or doesn't have /uploads, try to fix it
  if (!cleanUrl.startsWith("/uploads") && !cleanUrl.startsWith("uploads")) {
    // If it looks like a product image filename
    if (cleanUrl.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)) {
      cleanUrl = `/uploads/product_images/${cleanUrl.startsWith("/") ? cleanUrl.slice(1) : cleanUrl}`;
    }
  }

  // Ensure leading slash
  if (!cleanUrl.startsWith("/")) cleanUrl = `/${cleanUrl}`;
  
  // If API_BASE_URL is absolute (starts with http), use it
  if (API_BASE_URL.startsWith('http')) {
    let baseUrlForImages = API_BASE_URL;
    if (baseUrlForImages.endsWith("/api")) {
      baseUrlForImages = baseUrlForImages.slice(0, -4);
    }
    // Remove trailing slash if any
    if (baseUrlForImages.endsWith("/")) baseUrlForImages = baseUrlForImages.slice(0, -1);
    
    return `${baseUrlForImages}${cleanUrl}`;
  }
  
  return cleanUrl;
};


// Interceptor: Har request ke sath token bhejne ke liye
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Safer error handling to prevent 'payload' or 'undefined' crashes
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem("token");
      if (typeof window !== 'undefined' && !window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error?.response?.data || error);
  }
);

export default API;