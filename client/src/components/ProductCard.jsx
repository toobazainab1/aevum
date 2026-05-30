import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useState } from 'react'
import styles from '../styles/Products.module.css'

export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const [wished, setWished] = useState(false)
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardImg} style={{ background: product.bg || 'linear-gradient(145deg, #1A1410, #3A2E22)' }}>
        {product.badge && (
          <span className={`${styles.badge} ${styles[product.badge]}`}>
            {product.badge === 'bestseller' ? 'Bestseller' : product.badge === 'new' ? 'New' : 'Limited'}
          </span>
        )}
        <div className={styles.bottleWrap}>
          <svg viewBox="0 0 180 260" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.bottle}>
            <path d="M82 44 Q90 20 98 44" stroke="#B8965A" strokeWidth="0.6" opacity="0.5">
              <animate attributeName="opacity" values="0.5;0.1;0.5" dur="3s" repeatCount="indefinite"/>
            </path>
            <rect x="72" y="44" width="36" height="18" fill="#B8965A" rx="1"/>
            <rect x="78" y="62" width="24" height="20" fill={product.bottleColor || '#2A2018'} opacity="0.95"/>
            <rect x="55" y="82" width="70" height="160" rx="6" fill={product.bottleColor || '#2A2018'} opacity="0.95"/>
            <rect x="60" y="88" width="5" height="148" rx="2.5" fill="rgba(255,255,255,0.05)"/>
            <rect x="66" y="108" width="48" height="86" fill="rgba(0,0,0,0.5)" rx="2"/>
            <text x="90" y="148" textAnchor="middle" fontFamily="'Cormorant Garamond',serif" fontSize="11" fontStyle="italic" fill="#B8965A">{product.name}</text>
            <line x1="70" y1="153" x2="110" y2="153" stroke="#B8965A" strokeWidth="0.4" opacity="0.5"/>
            <text x="90" y="168" textAnchor="middle" fontFamily="'Jost',sans-serif" fontSize="5" letterSpacing="3" fill="rgba(250,248,243,0.4)">EAU DE PARFUM</text>
          </svg>
        </div>
        <div className={styles.cardOverlay}>
          <button className={styles.quickAdd} onClick={handleAdd}>
            {added ? '✓ Added' : 'Quick Add'}
          </button>
          <Link to={`/products/${product._id}`} className={styles.viewBtn}>View Details</Link>
        </div>
        <button
          className={styles.wishlist}
          onClick={() => setWished(!wished)}
          style={{ color: wished ? 'var(--gold)' : '' }}
        >
          {wished ? '♥' : '♡'}
        </button>
      </div>
      <div className={styles.cardInfo}>
        <span className={styles.cardTag}>{product.category} · {product.gender}</span>
        <h3 className={styles.cardName}>{product.name}</h3>
        <p className={styles.cardNotes}>{product.notes?.join(' · ')}</p>
        <div className={styles.cardFooter}>
          <span className={styles.cardPrice}>${product.price}</span>
          <span className={styles.cardSize}>{product.size}</span>
        </div>
      </div>
    </div>
  )
}