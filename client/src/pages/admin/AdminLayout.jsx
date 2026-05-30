import { useState } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/admin',          label: 'Dashboard',  icon: '◈' },
  { to: '/admin/products', label: 'Products',   icon: '◉' },
  { to: '/admin/orders',   label: 'Orders',     icon: '◎' },
  { to: '/admin/sales',    label: 'Sales',      icon: '🏷' },
  { to: '/admin/users',    label: 'Users',      icon: '◍' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate  = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  if (!user || user.role !== 'admin') {
    return (
      <div style={s.forbidden}>
        <p style={s.forbiddenCode}>403</p>
        <p style={s.forbiddenText}>Admin access only.</p>
        <Link to="/" style={s.forbiddenLink}>← Back to Store</Link>
      </div>
    )
  }

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div style={{ ...s.shell, gridTemplateColumns: collapsed ? '72px 1fr' : '240px 1fr' }}>
      {/* ── Sidebar ── */}
      <aside style={s.sidebar}>
        <div style={s.sideTop}>
          <div style={s.brand}>
            {!collapsed && (
              <div>
                <div style={s.brandName}>AEVUM</div>
                <div style={s.brandSub}>Admin Panel</div>
              </div>
            )}
            <button style={s.collapseBtn} onClick={() => setCollapsed(c => !c)}>
              {collapsed ? '›' : '‹'}
            </button>
          </div>

          <nav style={s.nav}>
            {NAV.map(item => {
              const active = location.pathname === item.to
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{
                    ...s.navItem,
                    ...(active ? s.navItemActive : {}),
                    justifyContent: collapsed ? 'center' : 'flex-start',
                  }}
                  title={collapsed ? item.label : ''}
                >
                  <span style={s.navIcon}>{item.icon}</span>
                  {!collapsed && <span style={s.navLabel}>{item.label}</span>}
                  {active && !collapsed && <span style={s.navDot} />}
                </Link>
              )
            })}
          </nav>
        </div>

        <div style={s.sideBottom}>
          {!collapsed && (
            <div style={s.userInfo}>
              <div style={s.userAvatar}>{user.name.charAt(0).toUpperCase()}</div>
              <div>
                <div style={s.userName}>{user.name}</div>
                <div style={s.userRole}>Administrator</div>
              </div>
            </div>
          )}
          <button
            style={{ ...s.logoutBtn, justifyContent: collapsed ? 'center' : 'flex-start' }}
            onClick={handleLogout}
          >
            <span style={{ fontSize: 16 }}>⏻</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={s.main}>
        <Outlet />
      </main>
    </div>
  )
}

const s = {
  shell: {
    display: 'grid',
    minHeight: '100vh',
    background: '#0A0A0A',
    transition: 'grid-template-columns 0.3s ease',
    fontFamily: "'Jost', sans-serif",
  },
  sidebar: {
    background: '#111111',
    borderRight: '1px solid rgba(201,169,110,0.12)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflow: 'hidden',
    transition: 'width 0.3s ease',
  },
  sideTop: { padding: '0 0 24px 0' },
  brand: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '32px 22px 28px',
    borderBottom: '1px solid rgba(201,169,110,0.08)',
    marginBottom: 20,
  },
  brandName: {
    fontSize: 18,
    fontWeight: 600,
    letterSpacing: '0.3em',
    color: '#C9A96E',
    fontFamily: "'Cormorant Garamond', serif",
  },
  brandSub: {
    fontSize: 10,
    letterSpacing: '0.2em',
    color: 'rgba(245,240,230,0.3)',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  collapseBtn: {
    background: 'none',
    border: '1px solid rgba(201,169,110,0.2)',
    color: '#C9A96E',
    width: 30, height: 30,
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  nav: { display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px' },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '13px 14px',
    borderRadius: 10,
    textDecoration: 'none',
    color: 'rgba(245,240,230,0.4)',
    fontSize: 15,
    fontWeight: 400,
    letterSpacing: '0.03em',
    transition: 'all 0.2s',
    position: 'relative',
  },
  navItemActive: {
    background: 'rgba(201,169,110,0.1)',
    color: '#C9A96E',
  },
  navIcon:  { fontSize: 17, flexShrink: 0 },
  navLabel: { flex: 1, fontSize: 15 },
  navDot:   { width: 5, height: 5, borderRadius: '50%', background: '#C9A96E' },
  sideBottom: {
    padding: '16px 12px 28px',
    borderTop: '1px solid rgba(201,169,110,0.08)',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    marginBottom: 10,
  },
  userAvatar: {
    width: 38, height: 38,
    borderRadius: '50%',
    background: 'rgba(201,169,110,0.12)',
    border: '1px solid rgba(201,169,110,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    color: '#C9A96E',
    fontWeight: 700,
    flexShrink: 0,
  },
  userName: { fontSize: 14, color: 'rgba(245,240,230,0.8)', fontWeight: 600 },
  userRole: { fontSize: 11, color: 'rgba(245,240,230,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '12px 14px',
    background: 'none',
    border: 'none',
    color: 'rgba(245,240,230,0.3)',
    fontSize: 14,
    cursor: 'pointer',
    borderRadius: 8,
    transition: 'color 0.2s',
    fontFamily: "'Jost', sans-serif",
  },
  main: {
    padding: '48px 56px',
    overflowY: 'auto',
    minHeight: '100vh',
    background: '#0A0A0A',
  },
  forbidden: {
    minHeight: '100vh',
    background: '#0A0A0A',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  forbiddenCode: { fontSize: 96, color: 'rgba(201,169,110,0.12)', fontFamily: "'Cormorant Garamond', serif", margin: 0 },
  forbiddenText: { color: 'rgba(245,240,230,0.4)', fontSize: 16, margin: 0 },
  forbiddenLink: { color: '#C9A96E', fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase' },
}