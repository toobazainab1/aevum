import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'

const API = 'http://localhost:5000/api'

const STATUS_COLORS = {
  pending:    { bg: 'rgba(201,169,110,0.12)', color: '#C9A96E' },
  confirmed:  { bg: 'rgba(100,160,100,0.12)', color: '#7AB87A' },
  processing: { bg: 'rgba(100,130,200,0.12)', color: '#7A9BE8' },
  shipped:    { bg: 'rgba(150,100,200,0.12)', color: '#B07AE8' },
  delivered:  { bg: 'rgba(80,180,100,0.12)',  color: '#50C87A' },
  cancelled:  { bg: 'rgba(200,80,80,0.12)',   color: '#E87A7A' },
}

export default function AdminDashboard() {
  const { token } = useAuth()
  const [stats, setStats]       = useState(null)
  const [orders, setOrders]     = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/orders/admin/stats`, { headers }),
      axios.get(`${API}/orders`, { headers }),
      axios.get(`${API}/products/admin/all`, { headers }),
    ]).then(([statsRes, ordersRes, productsRes]) => {
      setStats(statsRes.data)
      setOrders(ordersRes.data.orders?.slice(0, 6) || [])
      setProducts(productsRes.data)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <Loader />

  const lowStock = products.filter(p => p.stock <= 10 && p.isActive)

  const statCards = [
    { label: 'Total Orders',   value: stats?.totalOrders    ?? 0, icon: '◎', accent: '#C9A96E' },
    { label: 'Pending',        value: stats?.pendingOrders  ?? 0, icon: '◉', accent: '#E8C87A' },
    { label: 'Delivered',      value: stats?.deliveredOrders ?? 0, icon: '◈', accent: '#7AB87A' },
    { label: 'Total Revenue',  value: `PKR ${(stats?.totalRevenue ?? 0).toLocaleString()}`, icon: '◍', accent: '#B07AE8' },
  ]

  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <p style={s.eyebrow}>AEVUM · Admin</p>
        <h1 style={s.pageTitle}>Dashboard</h1>
        <p style={s.pageSub}>Welcome back — here's what's happening.</p>
      </div>

      {/* Stat Cards */}
      <div style={s.grid4}>
        {statCards.map(card => (
          <div key={card.label} style={s.statCard}>
            <div style={{ ...s.statIcon, color: card.accent, borderColor: card.accent + '30' }}>
              {card.icon}
            </div>
            <div style={{ ...s.statValue, color: card.accent }}>{card.value}</div>
            <div style={s.statLabel}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Low Stock Alerts */}
      {lowStock.length > 0 && (
        <div style={s.alertBox}>
          <div style={s.alertHead}>
            <span style={s.alertIcon}>⚠</span>
            <div>
              <p style={s.alertTitle}>Low Stock Alert</p>
              <p style={s.alertSub}>{lowStock.length} product{lowStock.length !== 1 ? 's' : ''} running low</p>
            </div>
            <Link to="/admin/products" style={s.alertLink}>Manage Products →</Link>
          </div>
          <div style={s.alertItems}>
            {lowStock.map(p => (
              <div key={p._id} style={s.alertItem}>
                <div style={{ ...s.alertDot, background: p.bottleColor }} />
                <span style={s.alertName}>{p.name}</span>
                <span style={{
                  ...s.alertStock,
                  color: p.stock === 0 ? '#E87A7A' : '#E8C87A',
                  background: p.stock === 0 ? 'rgba(200,80,80,0.1)' : 'rgba(232,200,122,0.1)',
                }}>
                  {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div style={s.section}>
        <div style={s.sectionHead}>
          <h2 style={s.sectionTitle}>Recent Orders</h2>
          <Link to="/admin/orders" style={s.seeAll}>See all →</Link>
        </div>
        <div style={s.table}>
          <div style={{ ...s.tableRow, ...s.tableHeader }}>
            <span>Order ID</span><span>Customer</span><span>Total</span>
            <span>Date</span><span>Status</span>
          </div>
          {orders.length === 0 && <div style={s.empty}>No orders yet.</div>}
          {orders.map(order => {
            const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending
            return (
              <div key={order._id} style={s.tableRow}>
                <span style={s.orderId}>#{order._id.slice(-6).toUpperCase()}</span>
                <span style={s.cell}>{order.user?.name || '—'}</span>
                <span style={s.cell}>PKR {order.total.toLocaleString()}</span>
                <span style={s.cell}>{new Date(order.createdAt).toLocaleDateString()}</span>
                <span>
                  <span style={{ ...s.badge, background: sc.bg, color: sc.color }}>
                    {order.status}
                  </span>
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Loader() {
  return <div style={{ padding: 80, textAlign: 'center', color: 'rgba(245,240,230,0.2)', fontSize: 13, letterSpacing: '0.2em' }}>LOADING...</div>
}

const s = {
  eyebrow:   { fontSize: 10, letterSpacing: '0.4em', color: '#C9A96E', textTransform: 'uppercase', marginBottom: 10, fontWeight: 300 },
  pageTitle: { fontSize: 36, color: 'rgba(245,240,230,0.9)', fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, margin: '0 0 6px' },
  pageSub:   { fontSize: 13, color: 'rgba(245,240,230,0.35)', margin: 0 },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 28 },
  statCard: { background: '#161616', border: '1px solid rgba(201,169,110,0.1)', borderRadius: 12, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 10 },
  statIcon:  { fontSize: 20, width: 40, height: 40, borderRadius: 10, border: '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 28, fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 },
  statLabel: { fontSize: 11, color: 'rgba(245,240,230,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' },

  alertBox:  { background: '#1A1108', border: '1px solid rgba(232,200,122,0.25)', borderRadius: 12, padding: '20px 24px', marginBottom: 28 },
  alertHead: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 },
  alertIcon: { fontSize: 20, color: '#E8C87A', flexShrink: 0 },
  alertTitle:{ fontSize: 14, color: '#E8C87A', fontWeight: 600, margin: 0 },
  alertSub:  { fontSize: 12, color: 'rgba(232,200,122,0.5)', margin: '3px 0 0' },
  alertLink: { marginLeft: 'auto', fontSize: 11, color: '#C9A96E', textDecoration: 'none', letterSpacing: '0.1em', whiteSpace: 'nowrap' },
  alertItems:{ display: 'flex', flexDirection: 'column', gap: 8 },
  alertItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 },
  alertDot:  { width: 24, height: 24, borderRadius: 6, flexShrink: 0 },
  alertName: { flex: 1, fontSize: 13, color: 'rgba(245,240,230,0.7)' },
  alertStock:{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 },

  section:     { background: '#161616', border: '1px solid rgba(201,169,110,0.1)', borderRadius: 12, overflow: 'hidden' },
  sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(201,169,110,0.08)' },
  sectionTitle:{ fontSize: 14, color: 'rgba(245,240,230,0.7)', fontWeight: 500, margin: 0, letterSpacing: '0.05em' },
  seeAll:      { fontSize: 11, color: '#C9A96E', textDecoration: 'none', letterSpacing: '0.1em' },
  table:       { width: '100%' },
  tableHeader: { color: 'rgba(245,240,230,0.25)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.02)' },
  tableRow:    { display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr 1fr 1fr', padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center', fontSize: 13 },
  orderId:     { color: '#C9A96E', fontWeight: 500, fontFamily: 'monospace', fontSize: 12 },
  cell:        { color: 'rgba(245,240,230,0.6)' },
  badge:       { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, textTransform: 'capitalize' },
  empty:       { padding: '40px 24px', textAlign: 'center', color: 'rgba(245,240,230,0.2)', fontSize: 13 },
}