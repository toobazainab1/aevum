import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

const API = 'http://localhost:5000/api'

const PROVINCES = [
  'Punjab','Sindh','Khyber Pakhtunkhwa','Balochistan',
  'Islamabad Capital Territory','Azad Jammu & Kashmir','Gilgit-Baltistan',
]

// ── Payment account details ──────────────────────────────────
const PAYMENT_ACCOUNTS = {
  easypaisa: { number: '0300-0000000', name: 'Azka Shahid', color: '#4CAF50', label: 'EasyPaisa' },
  jazzcash:  { number: '0300-0000000', name: 'Azka Shahid', color: '#E91E8C', label: 'JazzCash'  },
}

const PAYMENT_METHODS = [
  { id: 'cod',       label: 'Cash on Delivery', icon: '💵', desc: 'Pay when your order arrives' },
  { id: 'easypaisa', label: 'EasyPaisa',        icon: '📱', desc: 'Send to our EasyPaisa account' },
  { id: 'jazzcash',  label: 'JazzCash',         icon: '📲', desc: 'Send to our JazzCash account'  },
]

export default function Checkout() {
  const { cartItems, cartTotal, clearCart } = useCart()
  const { user, token } = useAuth()
  const navigate = useNavigate()

  const [step, setStep]           = useState(0)
  const [placing, setPlacing]     = useState(false)
  const [error, setError]         = useState('')
  const [order, setOrder]         = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [screenshot, setScreenshot]       = useState(null)
  const [screenshotPreview, setScreenshotPreview] = useState('')
  const fileRef = useRef()

  const [form, setForm] = useState({
    fullName:   user?.name || '',
    email:      user?.email || '',
    phone:      '',
    address:    '',
    city:       '',
    province:   'Punjab',
    postalCode: '',
    notes:      '',
  })

  const shippingCharge = cartTotal > 5000 ? 0 : 200
  const grandTotal     = cartTotal + shippingCharge

  if (!user) return (
    <main style={s.centerPage}>
      <div style={s.centerBox}>
        <p style={s.eyebrow}>AEVUM · Checkout</p>
        <h1 style={s.centerTitle}>Sign in to continue</h1>
        <Link to="/login" style={s.goldBtn}>Sign In →</Link>
      </div>
    </main>
  )

  if (cartItems.length === 0 && step !== 2) return (
    <main style={s.centerPage}>
      <div style={s.centerBox}>
        <p style={s.eyebrow}>AEVUM · Checkout</p>
        <h1 style={s.centerTitle}>Your cart is empty</h1>
        <Link to="/products" style={s.goldBtn}>Browse Fragrances →</Link>
      </div>
    </main>
  )

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleScreenshot = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setScreenshot(file)
    setScreenshotPreview(URL.createObjectURL(file))
  }

  const validate = () => {
    const { fullName, email, phone, address, city } = form
    if (!fullName || !email || !phone || !address || !city) {
      setError('Please fill in all required fields.'); return false
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address.'); return false
    }
    if (!/^[0-9]{10,11}$/.test(phone.replace(/\s|-/g, ''))) {
      setError('Please enter a valid phone number (10-11 digits).'); return false
    }
    if ((paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash') && !screenshot) {
      setError('Please upload your payment screenshot.'); return false
    }
    setError(''); return true
  }

  const handlePlaceOrder = async () => {
    setPlacing(true); setError('')
    try {
      const formData = new FormData()
      formData.append('items', JSON.stringify(cartItems.map(item => ({
        _id: item._id, product: item._id, name: item.name,
        price: item.price, quantity: item.quantity, size: item.size || item.sizes?.[0] || '',
      }))))
      formData.append('shippingAddress', JSON.stringify({
        fullName: form.fullName, phone: form.phone, address: form.address,
        city: form.city, province: form.province, postalCode: form.postalCode,
      }))
      formData.append('paymentMethod', paymentMethod)
      formData.append('notes', form.notes)
      if (screenshot) formData.append('paymentScreenshot', screenshot)

      const res = await axios.post(`${API}/orders`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      })
      setOrder(res.data)
      clearCart()
      setStep(2)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to place order. Please try again.')
    } finally { setPlacing(false) }
  }

  // ── SUCCESS PAGE ─────────────────────────────────────────────
  if (step === 2 && order) {
    const isDigital = order.paymentMethod === 'easypaisa' || order.paymentMethod === 'jazzcash'
    return (
      <main style={s.successPage}>
        <div style={s.successBg} />
        <div style={s.successCard}>
          <div style={s.successLogo}>
            <p style={s.successLogoText}>AEVUM</p>
            <p style={s.successLogoSub}>By Azka Shahid</p>
          </div>
          <div style={s.checkCircle}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="#C9A96E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p style={s.thankEyebrow}>Order Placed Successfully</p>
          <h1 style={s.thankTitle}>
            Thank you,<br />
            <em style={{ fontStyle: 'italic', color: '#C9A96E' }}>{user.name.split(' ')[0]}.</em>
          </h1>
          <p style={s.thankSub}>
            {isDigital
              ? `Your payment screenshot has been received. We'll verify your payment and confirm your order shortly. A confirmation will be sent to `
              : `Your order has been received. We'll contact you on `}
            <span style={{ color: '#C9A96E' }}>{isDigital ? form.email : form.phone}</span>
            {isDigital ? '.' : ' to confirm delivery.'}
          </p>

          <div style={s.orderBox}>
            <div style={s.orderBoxRow}>
              <span style={s.orderBoxLabel}>Order Reference</span>
              <span style={s.orderBoxValue}>#{order._id.slice(-6).toUpperCase()}</span>
            </div>
            <div style={s.orderBoxRow}>
              <span style={s.orderBoxLabel}>Payment</span>
              <span style={s.orderBoxValue}>
                {order.paymentMethod === 'cod' ? 'Cash on Delivery' :
                 order.paymentMethod === 'easypaisa' ? 'EasyPaisa' : 'JazzCash'}
                {isDigital && <span style={{ color: '#E8C87A', marginLeft: 8, fontSize: 11 }}>⏳ Pending Verification</span>}
              </span>
            </div>
            <div style={s.orderBoxRow}>
              <span style={s.orderBoxLabel}>Delivering to</span>
              <span style={s.orderBoxValue}>{form.city}, {form.province}</span>
            </div>
            <div style={{ ...s.orderBoxRow, borderBottom: 'none', paddingBottom: 0 }}>
              <span style={s.orderBoxLabel}>Total</span>
              <span style={{ ...s.orderBoxValue, color: '#C9A96E', fontSize: 20, fontWeight: 700 }}>
                PKR {order.total?.toLocaleString()}
              </span>
            </div>
          </div>

          {isDigital && (
            <div style={s.verifyNotice}>
              <p style={s.verifyText}>
                📋 Your payment is being reviewed. Orders are usually confirmed within 1–2 hours during business hours.
              </p>
            </div>
          )}

          <p style={s.thankNote}>✦ &nbsp; Thank you for choosing AEVUM. We can't wait for you to experience the scent.</p>

          <div style={s.successBtns}>
            <Link to="/products" style={s.goldBtn}>Continue Shopping</Link>
            <Link to="/" style={s.outlineBtn}>Back to Home</Link>
          </div>
        </div>
      </main>
    )
  }

  const account = PAYMENT_ACCOUNTS[paymentMethod]
  const needsScreenshot = paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash'

  // ── CHECKOUT FORM ────────────────────────────────────────────
  return (
    <main style={s.page}>
      <header style={s.header}>
        <Link to="/" style={s.headerLogo}>
          <span style={s.headerLogoText}>AEVUM</span>
          <span style={s.headerLogoSub}>By Azka Shahid</span>
        </Link>
        <div style={s.steps}>
          {['Shipping', 'Review', 'Confirm'].map((label, i) => (
            <div key={label} style={s.stepWrap}>
              <div style={{ ...s.stepNum, ...(i <= step ? s.stepNumActive : {}) }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ ...s.stepLabel, ...(i <= step ? s.stepLabelActive : {}) }}>{label}</span>
              {i < 2 && <div style={{ ...s.stepLine, ...(i < step ? s.stepLineActive : {}) }} />}
            </div>
          ))}
        </div>
        <Link to="/cart" style={s.backLink}>← Back to Cart</Link>
      </header>

      <div style={s.layout}>
        <div style={s.left}>
          {error && <div style={s.errorBox}>{error}</div>}

          {/* STEP 0: Shipping + Payment */}
          {step === 0 && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>Shipping Details</h2>
              <p style={s.cardSub}>Where should we deliver your order?</p>

              <div style={s.formGrid}>
                <Field label="Full Name *"      name="fullName"   value={form.fullName}   onChange={handleChange} placeholder="As on ID" span />
                <Field label="Email Address *"  name="email"      value={form.email}      onChange={handleChange} placeholder="for order updates" type="email" span />
                <Field label="Phone Number *"   name="phone"      value={form.phone}      onChange={handleChange} placeholder="03xx-xxxxxxx" type="tel" />
                <Field label="Postal Code"      name="postalCode" value={form.postalCode} onChange={handleChange} placeholder="44000" />
                <Field label="Street Address *" name="address"    value={form.address}    onChange={handleChange} placeholder="House no., Street, Area" span />
                <Field label="City *"           name="city"       value={form.city}       onChange={handleChange} placeholder="e.g. Lahore" />
                <div style={s.fieldWrap}>
                  <label style={s.fieldLabel}>Province *</label>
                  <select style={s.input} name="province" value={form.province} onChange={handleChange}>
                    {PROVINCES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div style={{ ...s.fieldWrap, gridColumn: '1 / -1' }}>
                  <label style={s.fieldLabel}>Order Notes (optional)</label>
                  <textarea style={{ ...s.input, height: 80, resize: 'vertical' }}
                    name="notes" value={form.notes} onChange={handleChange}
                    placeholder="Any special delivery instructions..."
                  />
                </div>
              </div>

              {/* Payment Method Selection */}
              <div style={{ marginBottom: 32 }}>
                <h3 style={s.paymentTitle}>Payment Method</h3>
                <div style={s.paymentOptions}>
                  {PAYMENT_METHODS.map(method => (
                    <button
                      key={method.id}
                      style={{ ...s.paymentOption, ...(paymentMethod === method.id ? s.paymentOptionActive : {}) }}
                      onClick={() => { setPaymentMethod(method.id); setScreenshot(null); setScreenshotPreview('') }}
                      type="button"
                    >
                      <span style={s.paymentIcon}>{method.icon}</span>
                      <div style={{ textAlign: 'left' }}>
                        <p style={s.paymentLabel}>{method.label}</p>
                        <p style={s.paymentDesc}>{method.desc}</p>
                      </div>
                      {paymentMethod === method.id && <span style={s.paymentCheck}>✓</span>}
                    </button>
                  ))}
                </div>

                {/* EasyPaisa / JazzCash instructions */}
                {needsScreenshot && (
                  <div style={s.paymentInstructions}>
                    <div style={{ ...s.accountBox, borderColor: account.color + '40' }}>
                      <div style={{ ...s.accountIcon, background: account.color }}>
                        {paymentMethod === 'easypaisa' ? '📱' : '📲'}
                      </div>
                      <div>
                        <p style={s.accountLabel}>{account.label} Account</p>
                        <p style={s.accountNumber}>{account.number}</p>
                        <p style={s.accountName}>{account.name}</p>
                      </div>
                    </div>

                    <div style={s.instructionSteps}>
                      <p style={s.instructionTitle}>How to pay:</p>
                      <p style={s.instructionStep}>1. Open your {account.label} app</p>
                      <p style={s.instructionStep}>2. Send <strong style={{ color: 'var(--gold-dark)' }}>PKR {grandTotal.toLocaleString()}</strong> to the number above</p>
                      <p style={s.instructionStep}>3. Take a screenshot of the confirmation</p>
                      <p style={s.instructionStep}>4. Upload the screenshot below</p>
                    </div>

                    {/* Screenshot upload */}
                    <div style={s.uploadArea} onClick={() => fileRef.current?.click()}>
                      {screenshotPreview ? (
                        <div style={s.previewWrap}>
                          <img src={screenshotPreview} alt="Payment screenshot" style={s.preview} />
                          <p style={s.previewLabel}>✓ Screenshot uploaded — tap to change</p>
                        </div>
                      ) : (
                        <>
                          <div style={s.uploadIcon}>📎</div>
                          <p style={s.uploadText}>Tap to upload payment screenshot</p>
                          <p style={s.uploadSub}>JPG, PNG or WebP · Max 5MB</p>
                        </>
                      )}
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleScreenshot}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button style={s.nextBtn} onClick={() => { if (validate()) setStep(1) }}>
                Review Order →
              </button>
            </div>
          )}

          {/* STEP 1: Review */}
          {step === 1 && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>Review Your Order</h2>
              <p style={s.cardSub}>Please confirm everything looks correct</p>

              <div style={s.reviewBlock}>
                <div style={s.reviewHead}>
                  <span style={s.reviewLabel}>Delivering to</span>
                  <button style={s.editBtn} onClick={() => setStep(0)}>✎ Edit</button>
                </div>
                <p style={s.reviewVal}>{form.fullName}</p>
                <p style={s.reviewSub}>{form.address}, {form.city}, {form.province}</p>
                <p style={s.reviewSub}>{form.phone} · {form.email}</p>
              </div>

              {/* Payment summary */}
              <div style={s.reviewBlock}>
                <span style={s.reviewLabel}>Payment Method</span>
                {paymentMethod === 'cod' ? (
                  <div style={s.codBox}>
                    <span style={{ fontSize: 28 }}>💵</span>
                    <div>
                      <p style={s.codTitle}>Cash on Delivery</p>
                      <p style={s.codSub}>Pay when your order arrives at your door.</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ ...s.codBox, borderColor: PAYMENT_ACCOUNTS[paymentMethod].color + '40' }}>
                    <span style={{ fontSize: 28 }}>{paymentMethod === 'easypaisa' ? '📱' : '📲'}</span>
                    <div style={{ flex: 1 }}>
                      <p style={s.codTitle}>{PAYMENT_ACCOUNTS[paymentMethod].label}</p>
                      <p style={s.codSub}>Payment sent to {PAYMENT_ACCOUNTS[paymentMethod].number}</p>
                    </div>
                    {screenshotPreview && (
                      <img src={screenshotPreview} alt="screenshot" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                    )}
                  </div>
                )}
              </div>

              <div style={s.reviewBlock}>
                <span style={s.reviewLabel}>Items ({cartItems.length})</span>
                {cartItems.map(item => (
                  <div key={`${item._id}-${item.size}`} style={s.reviewItem}>
                    <div style={{ ...s.reviewDot, background: item.bottleColor || '#3d5c30' }} />
                    <div style={{ flex: 1 }}>
                      <span style={s.reviewItemName}>{item.name}</span>
                      <span style={s.reviewItemMeta}> · {item.size || item.sizes?.[0]} · ×{item.quantity}</span>
                    </div>
                    <span style={s.reviewItemPrice}>PKR {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <button style={s.nextBtn} onClick={handlePlaceOrder} disabled={placing}>
                {placing ? 'Placing Order...' : '✓ Place Order'}
              </button>
              <button style={s.backBtn} onClick={() => setStep(0)}>← Back</button>
            </div>
          )}
        </div>

        {/* ── RIGHT: Summary ── */}
        <div style={s.right}>
          <div style={s.summaryCard}>
            <h3 style={s.summaryTitle}>Order Summary</h3>
            {cartItems.map(item => (
              <div key={`${item._id}-${item.size}`} style={s.summaryItem}>
                <div style={{ ...s.summaryDot, background: item.bottleColor || '#3d5c30' }} />
                <div style={{ flex: 1 }}>
                  <p style={s.summaryName}>{item.name}</p>
                  <p style={s.summaryMeta}>{item.size || item.sizes?.[0]} · ×{item.quantity}</p>
                </div>
                <span style={s.summaryPrice}>PKR {(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div style={s.divider} />
            <div style={s.summaryRow}><span>Subtotal</span><span>PKR {cartTotal.toLocaleString()}</span></div>
            <div style={s.summaryRow}>
              <span>Shipping</span>
              <span style={{ color: shippingCharge === 0 ? 'var(--olive)' : 'inherit' }}>
                {shippingCharge === 0 ? 'FREE' : `PKR ${shippingCharge}`}
              </span>
            </div>
            {shippingCharge === 0 && (
              <p style={{ fontSize: 11, color: 'var(--olive)', textAlign: 'right', margin: '-4px 0 8px' }}>
                🎉 Free on orders over PKR 5,000
              </p>
            )}
            <div style={s.divider} />
            <div style={{ ...s.summaryRow, ...s.grandRow }}>
              <span>Total</span>
              <span>PKR {grandTotal.toLocaleString()}</span>
            </div>
            <div style={s.codNotice}>
              <p style={s.codNoticeText}>
                {paymentMethod === 'cod'
                  ? '💵 Cash on Delivery — pay when your order arrives.'
                  : paymentMethod === 'easypaisa'
                  ? '📱 EasyPaisa — send payment & upload screenshot.'
                  : '📲 JazzCash — send payment & upload screenshot.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function Field({ label, name, value, onChange, placeholder, type = 'text', span }) {
  return (
    <div style={{ ...s.fieldWrap, ...(span ? { gridColumn: '1 / -1' } : {}) }}>
      <label style={s.fieldLabel}>{label}</label>
      <input style={s.input} type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  )
}

const s = {
  page:      { minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)' },
  header:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 60px', borderBottom: '1px solid var(--border-gold)', background: 'var(--surface)', flexWrap: 'wrap', gap: 16 },
  headerLogo:    { textDecoration: 'none', display: 'flex', flexDirection: 'column' },
  headerLogoText:{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: '0.4em', color: 'var(--text-primary)', fontWeight: 600 },
  headerLogoSub: { fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 },
  steps:     { display: 'flex', alignItems: 'center' },
  stepWrap:  { display: 'flex', alignItems: 'center', gap: 8 },
  stepNum:   { width: 34, height: 34, borderRadius: '50%', border: '1.5px solid rgba(184,146,74,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: 'rgba(28,23,18,0.3)', transition: 'all 0.3s' },
  stepNumActive: { borderColor: 'var(--gold)', background: 'var(--gold)', color: '#FFFFFF' },
  stepLabel: { fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(28,23,18,0.3)', transition: 'color 0.3s' },
  stepLabelActive: { color: 'var(--gold-dark)' },
  stepLine:  { width: 48, height: 1, background: 'rgba(184,146,74,0.2)', margin: '0 8px' },
  stepLineActive: { background: 'var(--gold)' },
  backLink:  { fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none', letterSpacing: '0.1em' },

  layout:    { display: 'grid', gridTemplateColumns: '1fr 400px', gap: 40, padding: '48px 60px 80px', maxWidth: 1200, margin: '0 auto' },
  left:      { display: 'flex', flexDirection: 'column', gap: 20 },
  card:      { background: 'var(--surface)', border: '1px solid var(--border-gold)', padding: '40px 44px', boxShadow: 'var(--shadow-sm)' },
  cardTitle: { fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, color: 'var(--text-primary)', margin: '0 0 8px' },
  cardSub:   { fontSize: 15, color: 'var(--text-muted)', fontWeight: 300, margin: '0 0 36px' },

  formGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 36 },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: 8 },
  fieldLabel:{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 500 },
  input:     { background: 'var(--bg-alt)', border: '1.5px solid var(--border)', padding: '14px 18px', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 300, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.3s', width: '100%', boxSizing: 'border-box' },

  // Payment
  paymentTitle:  { fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, color: 'var(--text-primary)', margin: '0 0 16px' },
  paymentOptions:{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 },
  paymentOption: { display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', border: '1.5px solid var(--border)', background: 'var(--bg-alt)', cursor: 'none', transition: 'all 0.2s', textAlign: 'left', width: '100%', fontFamily: 'var(--font-body)' },
  paymentOptionActive: { borderColor: 'var(--gold)', background: 'var(--gold-pale)' },
  paymentIcon:   { fontSize: 24, flexShrink: 0 },
  paymentLabel:  { fontSize: 15, color: 'var(--text-primary)', fontWeight: 600, margin: 0 },
  paymentDesc:   { fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0', fontWeight: 300 },
  paymentCheck:  { marginLeft: 'auto', color: 'var(--gold)', fontSize: 18, fontWeight: 700 },

  paymentInstructions: { display: 'flex', flexDirection: 'column', gap: 16 },
  accountBox:    { display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', border: '2px solid', background: 'var(--surface)' },
  accountIcon:   { width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 },
  accountLabel:  { fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 },
  accountNumber: { fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 2px', letterSpacing: '0.05em' },
  accountName:   { fontSize: 13, color: 'var(--text-muted)', margin: 0 },
  instructionSteps: { background: 'var(--bg-alt)', padding: '16px 20px', border: '1px solid var(--border)' },
  instructionTitle: { fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold-dark)', margin: '0 0 10px', fontWeight: 600 },
  instructionStep:  { fontSize: 14, color: 'var(--text-secondary)', margin: '6px 0', fontWeight: 300, lineHeight: 1.6 },
  uploadArea:    { border: '2px dashed var(--border-gold)', padding: '28px 20px', textAlign: 'center', cursor: 'none', transition: 'background 0.2s', background: 'var(--surface)' },
  uploadIcon:    { fontSize: 32, marginBottom: 8 },
  uploadText:    { fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, margin: '0 0 6px' },
  uploadSub:     { fontSize: 12, color: 'var(--text-muted)', margin: 0, fontWeight: 300 },
  previewWrap:   { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  preview:       { width: 120, height: 120, objectFit: 'cover', border: '2px solid var(--border-gold)' },
  previewLabel:  { fontSize: 13, color: 'var(--olive)', fontWeight: 500 },

  nextBtn:   { width: '100%', background: 'var(--gold)', color: '#FFFFFF', border: 'none', padding: '18px', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'none', transition: 'background 0.3s', boxShadow: 'var(--shadow-sm)' },
  backBtn:   { width: '100%', background: 'none', color: 'var(--text-muted)', border: 'none', padding: '14px', fontSize: 13, cursor: 'none', marginTop: 10, letterSpacing: '0.1em' },

  reviewBlock: { background: 'var(--bg-alt)', border: '1px solid var(--border)', padding: '20px 24px', marginBottom: 20 },
  reviewHead:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  reviewLabel: { fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold-dark)', fontWeight: 600, display: 'block', marginBottom: 12 },
  reviewVal:   { fontSize: 17, color: 'var(--text-primary)', fontWeight: 500, margin: '0 0 6px' },
  reviewSub:   { fontSize: 14, color: 'var(--text-muted)', margin: '3px 0', fontWeight: 300 },
  editBtn:     { fontSize: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'none', letterSpacing: '0.1em' },
  codBox:      { display: 'flex', gap: 16, alignItems: 'center', background: 'var(--surface)', border: '1.5px solid var(--border-gold)', padding: '18px 20px', marginTop: 12 },
  codTitle:    { fontSize: 16, color: 'var(--text-primary)', fontWeight: 600, margin: 0 },
  codSub:      { fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0', fontWeight: 300 },
  reviewItem:  { display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border)' },
  reviewDot:   { width: 28, height: 28, borderRadius: 6, flexShrink: 0 },
  reviewItemName: { fontSize: 15, color: 'var(--text-primary)', fontWeight: 500 },
  reviewItemMeta: { fontSize: 13, color: 'var(--text-muted)' },
  reviewItemPrice:{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 600, minWidth: 110, textAlign: 'right' },

  right:       {},
  summaryCard: { background: 'var(--surface)', border: '1.5px solid var(--border-gold)', padding: '32px', position: 'sticky', top: 24, boxShadow: 'var(--shadow-sm)' },
  summaryTitle:{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, color: 'var(--text-primary)', margin: '0 0 24px' },
  summaryItem: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  summaryDot:  { width: 32, height: 32, borderRadius: 8, flexShrink: 0 },
  summaryName: { fontSize: 15, color: 'var(--text-primary)', fontWeight: 500, margin: 0 },
  summaryMeta: { fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' },
  summaryPrice:{ fontSize: 14, color: 'var(--text-primary)', minWidth: 100, textAlign: 'right' },
  divider:     { height: 1, background: 'var(--border-gold)', margin: '16px 0' },
  summaryRow:  { display: 'flex', justifyContent: 'space-between', fontSize: 15, color: 'var(--text-secondary)', marginBottom: 10, fontWeight: 300 },
  grandRow:    { fontSize: 20, color: 'var(--text-primary)', fontWeight: 700, marginBottom: 0 },
  codNotice:   { background: 'var(--gold-pale)', border: '1px solid var(--border-gold)', padding: '14px 16px', marginTop: 20 },
  codNoticeText:{ fontSize: 13, color: 'var(--gold-dark)', margin: 0, lineHeight: 1.6 },

  errorBox:    { background: 'var(--mehron-pale)', border: '1px solid rgba(107,35,54,0.2)', borderLeft: '3px solid var(--mehron)', color: 'var(--mehron)', padding: '14px 18px', fontSize: 14, fontWeight: 300, lineHeight: 1.6 },

  // Success
  successPage: { minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-body)', position: 'relative', overflow: 'hidden' },
  successBg:   { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 40%, rgba(184,146,74,0.08) 0%, transparent 70%)' },
  successCard: { position: 'relative', zIndex: 2, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,169,110,0.2)', maxWidth: 560, width: '100%', padding: '60px 52px', textAlign: 'center', backdropFilter: 'blur(10px)' },
  successLogo: { marginBottom: 40 },
  successLogoText: { fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, letterSpacing: '0.5em', color: 'rgba(245,240,230,0.9)', margin: 0 },
  successLogoSub:  { fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#C9A96E', margin: '4px 0 0' },
  checkCircle: { width: 72, height: 72, borderRadius: '50%', border: '1.5px solid rgba(201,169,110,0.4)', background: 'rgba(201,169,110,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' },
  thankEyebrow:{ fontSize: 11, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#C9A96E', marginBottom: 16, fontWeight: 400 },
  thankTitle:  { fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 400, color: 'rgba(245,240,230,0.92)', lineHeight: 1.1, margin: '0 0 20px' },
  thankSub:    { fontSize: 16, color: 'rgba(245,240,230,0.45)', lineHeight: 1.9, fontWeight: 300, margin: '0 0 36px' },
  thankNote:   { fontSize: 13, color: 'rgba(201,169,110,0.6)', margin: '20px 0 32px', lineHeight: 1.7 },
  orderBox:    { background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(201,169,110,0.12)', padding: '24px 28px', marginBottom: 20, textAlign: 'left' },
  orderBoxRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  orderBoxLabel:{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(245,240,230,0.3)' },
  orderBoxValue:{ fontSize: 15, color: 'rgba(245,240,230,0.8)', fontWeight: 500 },
  verifyNotice:{ background: 'rgba(232,200,122,0.08)', border: '1px solid rgba(232,200,122,0.2)', padding: '14px 18px', marginBottom: 20 },
  verifyText:  { fontSize: 13, color: 'rgba(232,200,122,0.8)', margin: 0, lineHeight: 1.7 },
  successBtns: { display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' },
  goldBtn:     { background: 'var(--gold)', color: '#FFFFFF', padding: '16px 36px', fontSize: 13, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none', display: 'inline-block', fontFamily: 'var(--font-body)' },
  outlineBtn:  { background: 'none', color: 'rgba(245,240,230,0.45)', padding: '15px 36px', fontSize: 13, border: '1px solid rgba(255,255,255,0.12)', textDecoration: 'none', letterSpacing: '0.1em', display: 'inline-block', fontFamily: 'var(--font-body)' },

  centerPage:  { minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', padding: 24 },
  centerBox:   { textAlign: 'center', padding: '60px 48px', border: '1px solid rgba(201,169,110,0.2)', background: 'rgba(255,255,255,0.02)' },
  eyebrow:     { fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#C9A96E', marginBottom: 20, fontWeight: 300 },
  centerTitle: { fontFamily: 'var(--font-display)', fontSize: 42, color: 'rgba(245,240,230,0.9)', fontWeight: 400, margin: '0 0 24px' },
}