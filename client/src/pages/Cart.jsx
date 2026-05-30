import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import styles from '../styles/Cart.module.css'

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleCheckout = () => {
    if (!user) {
      navigate('/login')
    } else {
      navigate('/checkout')
    }
  }

  if (cartItems.length === 0) return (
    <main className={styles.empty}>
      <p className={styles.emptyEyebrow}>Your Cart</p>
      <h1 className={styles.emptyTitle}>Your cart is empty</h1>
      <p className={styles.emptySub}>Discover our fragrances and find your signature scent.</p>
      <Link to="/products" className="btn-primary">Explore Fragrances</Link>
    </main>
  )

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1 className={styles.title}>Your Cart</h1>
        <span className={styles.count}>{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</span>
      </div>

      <div className={styles.layout}>
        <div className={styles.items}>
          {cartItems.map(item => (
            <div key={`${item._id}-${item.size}`} className={styles.item}>
              <div className={styles.itemVisual} style={{ background: item.bg || 'linear-gradient(160deg, #1a2a1a, #3d5c30)' }}>
                <svg viewBox="0 0 120 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 60 }}>
                  <rect x="46" y="28" width="28" height="14" fill="#C9A96E" rx="1"/>
                  <rect x="50" y="42" width="20" height="14" fill={item.bottleColor || '#3d5c30'} opacity="0.95"/>
                  <rect x="34" y="56" width="52" height="90" rx="4" fill={item.bottleColor || '#3d5c30'} opacity="0.95"/>
                  <rect x="38" y="61" width="4" height="80" rx="2" fill="rgba(255,255,255,0.05)"/>
                </svg>
              </div>
              <div className={styles.itemInfo}>
                <h3 className={styles.itemName}>{item.name}</h3>
                <p className={styles.itemMeta}>{item.category} · {item.size || item.sizes?.[0]}</p>
                <p className={styles.itemPrice}>PKR {item.price.toLocaleString()}</p>
              </div>
              <div className={styles.itemActions}>
                <div className={styles.qty}>
                  <button onClick={() => updateQuantity(item._id, item.quantity - 1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item._id, item.quantity + 1)}>+</button>
                </div>
                <button className={styles.remove} onClick={() => removeFromCart(item._id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.summary}>
          <h2 className={styles.summaryTitle}>Order Summary</h2>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>PKR {cartTotal.toLocaleString()}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Shipping</span>
            <span>{cartTotal > 5000 ? 'Free' : 'PKR 200'}</span>
          </div>
          <div className={styles.summaryDivider} />
          <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
            <span>Total</span>
            <span>PKR {(cartTotal + (cartTotal > 5000 ? 0 : 200)).toLocaleString()}</span>
          </div>
          <button className={styles.checkoutBtn} onClick={handleCheckout}>
            Proceed to Checkout
          </button>
          <Link to="/products" className={styles.continueLink}>Continue Shopping</Link>
        </div>
      </div>
    </main>
  )
}