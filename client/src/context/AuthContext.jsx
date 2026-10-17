import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { API } from '../api'

const AuthContext = createContext()

function readSavedUser() {
  try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }, [])

  // On load: re-check the saved token with the server. The role shown in the UI always comes
  // from the server, so editing localStorage cannot make someone look like an admin.
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (!savedToken) { setLoading(false); return }

    let cancelled = false
    setToken(savedToken)
    setUser(readSavedUser())

    axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${savedToken}` } })
      .then(res => {
        if (cancelled) return
        setUser(res.data)
        localStorage.setItem('user', JSON.stringify(res.data))
      })
      .catch(err => {
        if (cancelled) return
        // Invalid/expired token -> log out. Network errors keep the session so the site still works offline-ish.
        if (err.response && (err.response.status === 401 || err.response.status === 403)) logout()
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [logout])

  // api.js fires this when any request comes back 401
  useEffect(() => {
    const onUnauthorized = () => logout()
    window.addEventListener('aevum:unauthorized', onUnauthorized)
    return () => window.removeEventListener('aevum:unauthorized', onUnauthorized)
  }, [logout])

  const login = (userData, tokenData) => {
    setUser(userData)
    setToken(tokenData)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', tokenData)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
