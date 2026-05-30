import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import axios from 'axios'
import styles from '../styles/ProductDetail.module.css'

const API = 'http://localhost:5000/api'

function BottleSVG({ name, color, size = 260 }) {
  return (
    <svg viewBox="0 0 200 320" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: size }}>
      <rect x="80" y="48" width="40" height="22" fill="#C9A96E" rx="2"/>
      <rect x="84" y="44" width="32" height="8" fill="#E2C98A" rx="1" opacity="0.8"/>
      <rect x="88" y="70" width="24" height="28" fill={color} opacity="0.95"/>
      <rect x="62" y="98" width="76" height="196" rx="6" fill={color} opacity="0.95"/>
      <rect x="70" y="138" width="60" height="110" fill="rgba(13,27,42,0.65)" rx="2"/>
      <text x="100" y="178" textAnchor="middle" fontFamily="'Cormorant Garamond',serif" fontSize="16" fontStyle="italic" fill="#C9A96E" opacity="0.95">{name}</text>
      <text x="100" y="202" textAnchor="middle" fontFamily="'Jost',sans-serif" fontSize="5.5" letterSpacing="3" fill="rgba(245,240,230,0.5)">AEVUM</text>
      <ellipse cx="100" cy="292" rx="36" ry="5" fill="rgba(201,169,110,0.12)"/>
    </svg>
  )
}

export default function ProductDetail() {
  const { id } = useParams()
  const { addToCart } = useCart()

  const [product, setProduct]           = useState(null)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [added, setAdded]               = useState(false)

  useEffect(() => {
    axios.get(`${API}/products/${id}`)
      .then(res => {
        setProduct(res.data)
        setSelectedSize(res.data.sizes?.[0] || '')
      })
      .catch(() => setError('Product not found.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ padding: '200px 60px', textAlign: 'center', background: '#ffffff', minHeight: '100vh' }}>
      <p style={{ color: '#94a3b8', fontFamily: 'var(--font-body)', letterSpacing: '0.2em', fontSize: 12 }}>
        LOADING...
      </p>
    </div>
  )

  if (error || !product) return (
    <div style={{ padding: '200px 60px', textAlign: 'center', background: '#ffffff', minHeight: '100vh' }}>
      <p style={{ color: '#0f172a', fontFamily: 'var(--font-display)', fontSize: 32, marginBottom: 24 }}>
        Product not found.
      </p>
      <Link to="/products" style={{ color: 'var(--gold)', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        ← Back to Fragrances
      </Link>
    </div>
  )

  const isHim       = product.filterKey === 'him'
  const accentColor = isHim ? 'var(--olive-light)' : 'var(--mehron-light)'
  const accentBg    = isHim
    ? 'linear-gradient(160deg, #1a2a1a 0%, #3d5c30 60%, #0d1a0d 100%)'
    : 'linear-gradient(160deg, #2a0d14 0%, #5a1e2e 60%, #1a0a10 100%)'

  const handleAdd = () => {
    addToCart({ ...product, size: selectedSize })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <main className={styles.main} style={{ background: '#ffffff' }}>
      {/* Visual side */}
      <div className={styles.visual} style={{ background: '#ffffff' }}>
        <div className={styles.visualPattern} />
        <div style={{
          position: 'absolute', top: 100, left: 40,
          fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase',
          color: accentColor, fontWeight: 400, writingMode: 'vertical-rl', opacity: 0.7,
        }}>
          {product.gender} · AEVUM
        </div>
        <div className={styles.visualInner} style={{
          animation: 'float 6s ease-in-out infinite',
          background: accentBg, borderRadius: '32px',
          padding: '50px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
        }}>
          <BottleSVG name={product.name} color={product.bottleColor} size={280} />
        </div>
      </div>

      {/* Info side */}
      <div className={styles.info} style={{ background: '#ffffff', color: '#0f172a' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 40 }}>
          <Link to="/" className={styles.back} style={{ color: '#64748b' }}>Home</Link>
          <span style={{ color: '#cbd5e1', fontSize: 12 }}>→</span>
          <Link to="/products" className={styles.back} style={{ color: '#64748b' }}>Fragrances</Link>
          <span style={{ color: '#cbd5e1', fontSize: 12 }}>→</span>
          <span style={{ fontSize: 12, color: accentColor, letterSpacing: '0.1em' }}>{product.name}</span>
        </div>

        {product.badge && (
          <span style={{
            display: 'inline-block', fontSize: 9, letterSpacing: '0.3em',
            textTransform: 'uppercase', background: isHim ? 'var(--olive)' : 'var(--mehron)',
            color: '#ffffff', padding: '5px 14px', marginBottom: 20,
            fontFamily: 'var(--font-body)', fontWeight: 500,
          }}>
            {product.badge}
          </span>
        )}

        <p style={{ fontSize: 12, letterSpacing: '0.3em', textTransform: 'uppercase', color: accentColor, fontWeight: 400, marginBottom: 12 }}>
          {product.category} · {product.gender}
        </p>
        <h1 className={styles.name} style={{ color: '#0f172a' }}>{product.name}</h1>
        <p className={styles.tagline} style={{ color: '#475569' }}>{product.tagline}</p>
        <p className={styles.price} style={{ color: '#0f172a' }}>PKR {product.price?.toLocaleString()}</p>

        <div style={{ width: 48, height: 1, background: accentColor, opacity: 0.5, margin: '28px 0' }} />

        <p className={styles.description} style={{ color: '#475569' }}>{product.description}</p>

        {/* Notes */}
        <div className={styles.notes} style={{ borderLeft: `2px solid ${isHim ? 'var(--olive)' : 'var(--mehron)'}` }}>
          {[
            { label: 'Top Notes',   items: product.topNotes },
            { label: 'Heart Notes', items: product.heartNotes },
            { label: 'Base Notes',  items: product.baseNotes },
          ].map(group => (
            <div key={group.label} className={styles.noteGroup}>
              <p style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: accentColor, fontWeight: 500, marginBottom: 8, fontFamily: 'var(--font-body)' }}>
                {group.label}
              </p>
              <p style={{ fontSize: 13, color: '#475569', fontWeight: 300, lineHeight: 1.8 }}>
                {group.items?.join(', ')}
              </p>
            </div>
          ))}
        </div>

        {/* Size selector */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#64748b', fontWeight: 300, marginBottom: 14 }}>
            Select Size
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            {product.sizes?.map(s => (
              <button
                key={s}
                onClick={() => setSelectedSize(s)}
                style={{
                  padding: '12px 24px',
                  border: `1px solid ${selectedSize === s ? accentColor : 'rgba(15,23,42,0.15)'}`,
                  background: selectedSize === s ? (isHim ? 'var(--olive)' : 'var(--mehron)') : '#ffffff',
                  color: selectedSize === s ? '#ffffff' : '#475569',
                  fontFamily: 'var(--font-body)', fontSize: 13, letterSpacing: '0.1em',
                  cursor: 'pointer', transition: 'all 0.3s', borderRadius: '10px',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Add to cart */}
        <button
          onClick={handleAdd}
          style={{
            background: isHim ? 'var(--olive)' : 'var(--mehron)',
            color: '#FFFFFF', border: 'none', padding: '18px 56px',
            fontFamily: 'var(--font-body)', fontSize: 13, letterSpacing: '0.3em',
            textTransform: 'uppercase', fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.3s', marginBottom: 20, display: 'inline-block',
            boxShadow: 'var(--shadow-md)', borderRadius: '12px',
          }}
        >
          {added ? '✓ Added to Cart' : 'Add to Cart'}
        </button>

        <br />
        <Link
          to="/products"
          style={{ fontSize: 12, color: '#64748b', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 300 }}
        >
          ← Back to All Fragrances
        </Link>
      </div>
    </main>
  )
}