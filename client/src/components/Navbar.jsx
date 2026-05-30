import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import styles from '../styles/Navbar.module.css'

const NAV_LINKS = [
  { to: '/',                  label: 'Home' },
  { to: '/products',          label: 'All Fragrances' },
  { to: '/products?filter=him', label: 'For Him' },
  { to: '/products?filter=her', label: 'For Her' },
  { to: '/about',             label: 'Our Story' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const { cartCount } = useCart()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [scrolled, setScrolled]     = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false) }, [location])

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  const handleLogout = () => { logout(); navigate('/'); setDrawerOpen(false) }

  return (
    <>
      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>

        {/* ── Hamburger (mobile only) ── */}
        <button
          className={`${styles.hamburger} ${drawerOpen ? styles.hamburgerOpen : ''}`}
          onClick={() => setDrawerOpen(d => !d)}
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>

        {/* ── Logo (center on mobile, left on desktop) ── */}
        <Link to="/" className={styles.logo}>
          <div className={styles.logoText}>AEVUM</div>
          <div className={styles.logoSub}>By Azka Shahid</div>
        </Link>

        {/* ── Desktop nav links ── */}
        <ul className={styles.links}>
          {NAV_LINKS.map(link => (
            <li key={link.to}>
              <Link to={link.to}>{link.label}</Link>
            </li>
          ))}
        </ul>

        {/* ── Desktop right actions ── */}
        <div className={styles.right}>
          {user ? (
            <>
              <span className={styles.welcome}>Hi, {user.name.split(' ')[0]}</span>
              <button className={styles.textBtn} onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login"    className={styles.textBtn}>Login</Link>
              <Link to="/register" className={styles.textBtn}>Register</Link>
            </>
          )}
          <Link to="/cart" className={styles.cartBtn}>
            Cart {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
          </Link>
        </div>

        {/* ── Mobile: cart icon always visible ── */}
        <Link to="/cart" className={styles.mobileCart}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          {cartCount > 0 && <span className={styles.mobileCartBadge}>{cartCount}</span>}
        </Link>
      </nav>

      {/* ── Backdrop ── */}
      <div
        className={`${styles.backdrop} ${drawerOpen ? styles.backdropOpen : ''}`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* ── Slide-in Drawer ── */}
      <aside className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ''}`}>

        {/* Drawer header */}
        <div className={styles.drawerHeader}>
          <div>
            <div className={styles.drawerLogo}>AEVUM</div>
            <div className={styles.drawerLogoSub}>By Azka Shahid</div>
          </div>
          <button className={styles.closeBtn} onClick={() => setDrawerOpen(false)}>✕</button>
        </div>

        {/* Nav links */}
        <nav className={styles.drawerNav}>
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.to}
              to={link.to}
              className={styles.drawerLink}
              style={{ animationDelay: drawerOpen ? `${i * 0.06}s` : '0s' }}
            >
              <span>{link.label}</span>
              <span className={styles.drawerArrow}>→</span>
            </Link>
          ))}
        </nav>

        {/* Divider */}
        <div className={styles.drawerDivider} />

        {/* Auth section */}
        <div className={styles.drawerAuth}>
          {user ? (
            <>
              <p className={styles.drawerWelcome}>
                Signed in as <strong>{user.name}</strong>
              </p>
              <button className={styles.drawerLogout} onClick={handleLogout}>
                Sign Out
              </button>
            </>
          ) : (
            <div className={styles.drawerAuthBtns}>
              <Link to="/login"    className={styles.drawerLoginBtn}>Sign In</Link>
              <Link to="/register" className={styles.drawerRegisterBtn}>Create Account</Link>
            </div>
          )}
        </div>

        {/* Cart */}
        <Link to="/cart" className={styles.drawerCart} onClick={() => setDrawerOpen(false)}>
          <span>Cart</span>
          {cartCount > 0
            ? <span className={styles.drawerCartBadge}>{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
            : <span className={styles.drawerCartEmpty}>Empty</span>
          }
        </Link>

        {/* Footer */}
        <div className={styles.drawerFooter}>
          <p>@aevum_byazka</p>
        </div>
      </aside>
    </>
  )
}