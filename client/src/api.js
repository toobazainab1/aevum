import axios from 'axios'

// Set VITE_API_URL in your hosting dashboard (e.g. https://your-api.onrender.com/api).
// In local dev it falls back to the local server.
const fromEnv = import.meta.env.VITE_API_URL
export const API = (fromEnv || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api')).replace(/\/+$/, '')

<<<<<<< HEAD
=======
if (!fromEnv && !import.meta.env.DEV) {
  console.error('VITE_API_URL is not set. Add it in Vercel (Settings > Environment Variables) and redeploy.')
}

// A web page where JSON was expected means the API address is wrong (e.g. VITE_API_URL missing).
axios.interceptors.response.use(res => {
  const type = String(res.headers?.['content-type'] || '')
  if (type.includes('text/html') && typeof res.data === 'string') {
    return Promise.reject(new Error('The API returned a web page instead of data. Check VITE_API_URL.'))
  }
  return res
})

>>>>>>> 1fc1e36 (Vercel serverless backend)
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
