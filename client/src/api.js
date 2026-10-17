cat > client/src/api.js <<'EOF'
import axios from 'axios'

const fromEnv = import.meta.env.VITE_API_URL

export const API = (
  fromEnv ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api')
).replace(/\/+$/, '')

if (!fromEnv && !import.meta.env.DEV) {
  console.error(
    'VITE_API_URL is not set. Add it in Vercel and redeploy.'
  )
}

axios.interceptors.response.use(
  (res) => {
    const type = String(res.headers?.['content-type'] || '')

    if (type.includes('text/html') && typeof res.data === 'string') {
      return Promise.reject(
        new Error('The API returned a web page instead of data. Check VITE_API_URL.')
      )
    }

    return res
  }
)

axios.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || ''

    if (
      err.response?.status === 401 &&
      !/\/auth\/(login|register)$/.test(url)
    ) {
      window.dispatchEvent(new Event('aevum:unauthorized'))
    }

    return Promise.reject(err)
  }
)
EOF