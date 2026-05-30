import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import styles from '../styles/Auth.module.css'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await axios.post(
        'http://localhost:5000/api/auth/login',
        form
      )
      login(res.data.user, res.data.token)
      navigate('/')
    } catch (err) {
      setError(
        err.response?.data?.message || 'Login failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.main}>

      {/* Visual left side */}
      <div
        className={styles.visual}
        style={{
          background:
            'linear-gradient(160deg, #0d1a0d 0%, #2d4a2d 50%, #1a0a10 100%)',
        }}
      >
        <div className={styles.visualPattern} />
        <div className={styles.visualContent}>
          <p style={{
            fontSize: 10,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            fontWeight: 300,
            marginBottom: 24,
          }}>
            AEVUM · By Azka Shahid
          </p>

          <h2 className={styles.visualTitle}>
            Welcome
            <em>Back</em>
          </h2>

          <p className={styles.visualSub}>
            Your fragrance journey continues.
          </p>

          <div style={{
            marginTop: 48,
            display: 'flex',
            gap: 10,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <div style={{
              width: 10, height: 10,
              borderRadius: '50%',
              background: 'var(--olive-light)',
            }} />
            <span style={{
              fontSize: 10,
              letterSpacing: '0.2em',
              color: 'rgba(245,240,230,0.3)',
              textTransform: 'uppercase',
            }}>Him</span>
            <span style={{ color: 'rgba(245,240,230,0.15)', margin: '0 6px' }}>·</span>
            <div style={{
              width: 10, height: 10,
              borderRadius: '50%',
              background: 'var(--mehron-light)',
            }} />
            <span style={{
              fontSize: 10,
              letterSpacing: '0.2em',
              color: 'rgba(245,240,230,0.3)',
              textTransform: 'uppercase',
            }}>Her</span>
          </div>

          {/* Decorative rings */}
          <div style={{
            position: 'absolute',
            width: 320, height: 320,
            borderRadius: '50%',
            border: '1px solid rgba(201,169,110,0.06)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            width: 480, height: 480,
            borderRadius: '50%',
            border: '1px solid rgba(201,169,110,0.03)',
            pointerEvents: 'none',
          }} />
        </div>
      </div>

      {/* Form right side */}
      <div className={styles.formWrap}>
        <div className={styles.formInner}>

          <Link to="/" className={styles.formLogo}>AEVUM</Link>
          <span className={styles.formLogoSub}>By Azka Shahid</span>

          <h1 className={styles.formTitle}>Sign In</h1>
          <p className={styles.formSub}>
            Don't have an account?{' '}
            <Link to="/register" className={styles.formLink}>
              Create one
            </Link>
          </p>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={styles.input}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className={styles.input}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <Link to="/" className={styles.homeLink}>← Back to Home</Link>
        </div>
      </div>
    </main>
  )
}