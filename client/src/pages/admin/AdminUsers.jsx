import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'

const API = 'http://localhost:5000/api'

export default function AdminUsers() {
  const { token } = useAuth()
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    axios.get(`${API}/auth/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setUsers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token])

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <Loader />

  return (
    <div>
      <div style={s.topBar}>
        <div>
          <p style={s.eyebrow}>AEVUM · Admin</p>
          <h1 style={s.pageTitle}>Users</h1>
        </div>
        <input
          style={s.search}
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Summary */}
      <div style={s.summary}>
        <div style={s.summaryCard}>
          <div style={s.summaryVal}>{users.length}</div>
          <div style={s.summaryLabel}>Total Users</div>
        </div>
        <div style={s.summaryCard}>
          <div style={{ ...s.summaryVal, color: '#B07AE8' }}>
            {users.filter(u => u.role === 'admin').length}
          </div>
          <div style={s.summaryLabel}>Admins</div>
        </div>
        <div style={s.summaryCard}>
          <div style={{ ...s.summaryVal, color: '#7AB87A' }}>
            {users.filter(u => {
              const d = new Date(u.createdAt)
              const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
              return d >= weekAgo
            }).length}
          </div>
          <div style={s.summaryLabel}>New This Week</div>
        </div>
      </div>

      <div style={s.tableWrap}>
        <div style={{ ...s.row, ...s.headerRow }}>
          <span>User</span><span>Email</span><span>Role</span><span>Joined</span>
        </div>
        {filtered.length === 0 && <div style={s.empty}>No users found.</div>}
        {filtered.map(user => (
          <div key={user._id} style={s.row}>
            <div style={s.userCell}>
              <div style={s.avatar}>{user.name.charAt(0).toUpperCase()}</div>
              <span style={s.userName}>{user.name}</span>
            </div>
            <span style={s.cell}>{user.email}</span>
            <span>
              <span style={{
                ...s.badge,
                ...(user.role === 'admin' ? s.badgeAdmin : s.badgeUser)
              }}>
                {user.role}
              </span>
            </span>
            <span style={s.cell}>
              {new Date(user.createdAt).toLocaleDateString('en-PK', {
                year: 'numeric', month: 'short', day: 'numeric'
              })}
            </span>
          </div>
        ))}
      </div>

      <p style={s.note}>
        💡 To promote a user to admin, change their <code style={s.code}>role</code> field
        to <code style={s.code}>"admin"</code> directly in MongoDB Compass.
      </p>
    </div>
  )
}

function Loader() {
  return <div style={{ padding: 80, textAlign: 'center', color: 'rgba(245,240,230,0.2)', fontSize: 13, letterSpacing: '0.2em' }}>LOADING...</div>
}

const s = {
  eyebrow: { fontSize: 10, letterSpacing: '0.4em', color: '#C9A96E', textTransform: 'uppercase', marginBottom: 10, fontWeight: 300 },
  pageTitle: { fontSize: 36, color: 'rgba(245,240,230,0.9)', fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, margin: 0 },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 },
  search: { background: '#161616', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 8, padding: '10px 16px', color: 'rgba(245,240,230,0.7)', fontSize: 13, outline: 'none', width: 260, fontFamily: "'Jost', sans-serif" },
  summary: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 },
  summaryCard: { background: '#161616', border: '1px solid rgba(201,169,110,0.1)', borderRadius: 12, padding: '24px', textAlign: 'center' },
  summaryVal: { fontSize: 36, fontFamily: "'Cormorant Garamond', serif", color: '#C9A96E', fontWeight: 400 },
  summaryLabel: { fontSize: 11, color: 'rgba(245,240,230,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 6 },
  tableWrap: { background: '#161616', border: '1px solid rgba(201,169,110,0.1)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
  headerRow: { color: 'rgba(245,240,230,0.25)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.02)', fontWeight: 400 },
  row: { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1.2fr', padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center', fontSize: 13 },
  userCell: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#C9A96E', fontWeight: 600, flexShrink: 0 },
  userName: { color: 'rgba(245,240,230,0.8)', fontWeight: 500 },
  cell: { color: 'rgba(245,240,230,0.45)', fontSize: 13 },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, textTransform: 'capitalize' },
  badgeAdmin: { background: 'rgba(150,100,200,0.12)', color: '#B07AE8' },
  badgeUser:  { background: 'rgba(255,255,255,0.05)',  color: 'rgba(245,240,230,0.4)' },
  empty: { padding: '60px 24px', textAlign: 'center', color: 'rgba(245,240,230,0.2)', fontSize: 13 },
  note: { fontSize: 12, color: 'rgba(245,240,230,0.3)', padding: '14px 18px', background: '#161616', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', lineHeight: 1.6 },
  code: { background: 'rgba(201,169,110,0.1)', color: '#C9A96E', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace' },
}