import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import axios from 'axios'
import styles from '../styles/Products.module.css'

const API = 'http://localhost:5000/api'

const tabs = [
  { label: 'All Fragrances', value: 'all' },
  { label: 'For Him',        value: 'him' },
  { label: 'For Her',        value: 'her' },
]

function BottleSVG({ name, color, size = 130 }) {
  return (
    <svg viewBox="0 0 200 320" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: size }}>
      <path d="M100 48 Q93 24 102 8" stroke="#C9A96E" strokeWidth="0.8" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="3s" repeatCount="indefinite"/>
      </path>
      <rect x="80" y="48" width="40" height="22" fill="#C9A96E" rx="2"/>
      <rect x="84" y="44" width="32" height="8" fill="#E2C98A" rx="1" opacity="0.8"/>
      <rect x="88" y="70" width="24" height="28" fill={color} opacity="0.95"/>
      <rect x="62" y="98" width="76" height="196" rx="6" fill={color} opacity="0.95"/>
      <rect x="67" y="104" width="7" height="184" rx="3.5" fill="rgba(255,255,255,0.07)"/>
      <rect x="70" y="138" width="60" height="110" fill="rgba(28,23,18,0.55)" rx="2"/>
      <text x="100" y="178" textAnchor="middle" fontFamily="'Cormorant Garamond',serif" fontSize="14" fontStyle="italic" fill="#C9A96E">{name}</text>
      <text x="100" y="202" textAnchor="middle" fontFamily="'Jost',sans-serif" fontSize="5.5" letterSpacing="3" fill="rgba(250,247,242,0.5)">AEVUM</text>
      <ellipse cx="100" cy="292" rx="36" ry="5" fill="rgba(184,146,74,0.12)"/>
    </svg>
  )
}

function ProductCard({ product }) {
  const { addToCart } = useCart()
  const [added, setAdded] = useState(false)
  const isHim = product.filterKey === 'him'
  const accentColor = isHim ? 'var(--olive)' : 'var(--mehron)'
  const accentLight = isHim ? 'var(--olive-light)' : 'var(--mehron-light)'

  const handleAdd = () => {
    addToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardTop} style={{ background: product.bg }}>
        {product.badge && (
          <span className={styles.badge} style={{ background: accentColor }}>
            {product.badge}
          </span>
        )}
        <div className={styles.cardBottle} style={{ animation: 'float 6s ease-in-out infinite' }}>
          <BottleSVG name={product.name} color={product.bottleColor} size={140} />
        </div>
      </div>

      <div className={styles.cardInfo}>
        <span className={styles.cardTag} style={{ color: accentLight }}>
          {product.gender} · {product.category}
        </span>
        <h3 className={styles.cardName}>{product.name}</h3>
        <p className={styles.cardTagline}>{product.tagline}</p>
        <p className={styles.cardNotes}>{product.notes?.join(' · ')}</p>

        <div className={styles.cardFooter}>
          <div className={styles.cardPriceRow}>
            <span className={styles.cardPrice}>PKR {product.price?.toLocaleString()}</span>
            <span className={styles.cardSize}>{product.sizes?.[0]}</span>
          </div>
          <div className={styles.cardButtons}>
            <button
              className={`${styles.addBtn} ${added ? styles.addBtnAdded : ''}`}
              onClick={handleAdd}
            >
              {added ? '✓ Added' : 'Add to Cart'}
            </button>
            <Link to={`/products/${product._id}`} className={styles.viewBtn}>
              Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Products() {
  const [searchParams] = useSearchParams()
  const [activeFilter, setActiveFilter] = useState('all')
  const [products, setProducts]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')

  useEffect(() => {
    const f = searchParams.get('filter')
    setActiveFilter(f || 'all')
  }, [searchParams])

  useEffect(() => {
    setLoading(true)
    const params = activeFilter !== 'all' ? `?filter=${activeFilter}` : ''
    axios.get(`${API}/products${params}`)
      .then(res => setProducts(res.data))
      .catch(() => setError('Failed to load fragrances.'))
      .finally(() => setLoading(false))
  }, [activeFilter])

  const heroBg = activeFilter === 'him'
    ? 'linear-gradient(160deg, #0d1a0d, #2d4a2d, #1a2d1a)'
    : activeFilter === 'her'
    ? 'linear-gradient(160deg, #1a0a10, #5a1e2e, #2a0d18)'
    : 'linear-gradient(160deg, #1C1712, #2E2418, #1C1712)'

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <section className={styles.pageHero} style={{ background: heroBg }}>
        <p className={styles.pageEyebrow}>AEVUM · The Collection</p>
        <h1 className={styles.pageTitle}>
          {activeFilter === 'him' ? 'For Him' : activeFilter === 'her' ? 'For Her' : 'All Fragrances'}
        </h1>
        <p className={styles.pageSub}>
          {activeFilter === 'him' ? 'Bold. Grounded. Unforgettable.' : activeFilter === 'her' ? 'Delicate. Deep. Magnetic.' : 'Four fragrances. One legacy.'}
        </p>
      </section>

      <div className={styles.filterBar}>
        <div className={styles.filterTabs}>
          {tabs.map(tab => (
            <button
              key={tab.value}
              className={`${styles.filterTab} ${activeFilter === tab.value ? styles.active : ''}`}
              onClick={() => setActiveFilter(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className={styles.productCount}>
          {loading ? '...' : `${products.length} fragrance${products.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      <div className={styles.productsMain}>
        {loading && <p className={styles.noResults} style={{ opacity: 0.4 }}>Loading fragrances...</p>}
        {error  && <p className={styles.noResults} style={{ color: '#E87A7A' }}>{error}</p>}
        {!loading && !error && products.length === 0 && (
          <p className={styles.noResults}>No fragrances found.</p>
        )}
        {!loading && !error && products.length > 0 && (
          <div className={styles.productsGrid}>
            {products.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </div>
    </main>
  )
}