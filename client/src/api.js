import axios from 'axios'

// Set VITE_API_URL in your hosting dashboard (e.g. https://your-api.onrender.com/api).
// In local dev it falls back to the local server.
const fromEnv = import.meta.env.VITE_API_URL
export const API = (fromEnv || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api')).replace(/\/+$/, '')

// If the server says our token is invalid/expired, tell the app to log out.
axios.interceptors.response.use(
  res => res,
  err => {
    const url = err.config?.url || ''
    if (err.response?.status === 401 && !/\/auth\/(login|register)$/.test(url)) {
      window.dispatchEvent(new Event('aevum:unauthorized'))
    }
    return Promise.reject(err)
  }
)
