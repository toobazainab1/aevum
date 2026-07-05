import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'

const API = 'http://localhost:5000/api'

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

const STATUS_COLORS = {
  pending:    { bg: 'rgba(201,169,110,0.12)', color: '#C9A96E' },
  confirmed:  { bg: 'rgba(100,160,100,0.12)', color: '#7AB87A' },
  processing: { bg: 'rgba(100,130,200,0.12)', color: '#7A9BE8' },
  shipped:    { bg: 'rgba(150,100,200,0.12)', color: '#B07AE8' },
  delivered:  { bg: 'rgba(80,180,100,0.12)',  color: '#50C87A' },
  cancelled:  { bg: 'rgba(200,80,80,0.12)',   color: '#E87A7A' },
}

const PAYMENT_LABELS = {
  cod:       'Cash on Delivery',
  easypaisa: 'EasyPaisa',
  jazzcash:  'JazzCash',
}

export default function AdminOrders() {
  const { token } = useAuth()
  const [orders, setOrders]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [selected, setSelected]         = useState(null)
  const [updating, setUpdating]         = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue]     = useState('')
  const [savingNotes, setSavingNotes]   = useState(false)
  const [confirmingPayment, setConfirmingPayment] = useState(false)
  const [screenshotOpen, setScreenshotOpen]       = useState(false)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchOrders = async () => {
    try {
      const params = filterStatus !== 'all' ? `?status=${filterStatus}` : ''
      const res = await axios.get(`${API}/orders${params}`, { headers })
      setOrders(res.data.orders || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchOrders() }, [filterStatus])

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(true)
    try {
      await axios.put(`${API}/orders/${orderId}/status`, { status: newStatus }, { headers })
      fetchOrders()
      if (selected?._id === orderId) setSelected(prev => ({ ...prev, status: newStatus }))
    } catch (e) { console.error(e) }
    finally { setUpdating(false) }
  }

  const handleConfirmPayment = async () => {
    setConfirmingPayment(true)
    try {
      const res = await axios.put(`${API}/orders/${selected._id}/confirm-payment`, {}, { headers })
      setSelected(prev => ({ ...prev, paymentConfirmed: true, paymentConfirmedAt: res.data.paymentConfirmedAt }))
      fetchOrders()
    } catch (e) { console.error(e) }
    finally { setConfirmingPayment(false) }
  }

  const openOrder = (order) => {
    setSelected(order)
    setNotesValue(order.notes || '')
    setEditingNotes(false)
    setScreenshotOpen(false)
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      await axios.put(`${API}/orders/${selected._id}/status`, { status: selected.status, notes: notesValue }, { headers })
      setSelected(prev => ({ ...prev, notes: notesValue }))
      setEditingNotes(false)
      fetchOrders()
    } catch (e) { console.error(e) }
    finally { setSavingNotes(false) }
  }

  // Count orders needing payment verification
  const pendingVerification = orders.filter(o =>
    (o.paymentMethod === 'easypaisa' || o.paymentMethod === 'jazzcash') && !o.paymentConfirmed
  ).length

  if (loading) return <Loader />

  return (
    <div style={{ fontFamily: "'Jost', sans-serif" }}>
      <div style={s.topBar}>
        <div>
          <p style={s.eyebrow}>AEVUM · Admin</p>
          <h1 style={s.pageTitle}>Orders</h1>
          {pendingVerification > 0 && (
            <div style={s.verifyAlert}>
              ⚠ {pendingVerification} order{pendingVerification !== 1 ? 's' : ''} awaiting payment verification
            </div>
          )}
        </div>
        <div style={s.filterRow}>
          {['all', ...STATUSES].map(st => (
            <button
              key={st}
              style={{ ...s.filterBtn, ...(filterStatus === st ? s.filterBtnActive : {}) }}
              onClick={() => setFilterStatus(st)}
            >
              {st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={s.tableWrap}>
        <div style={{ ...s.row, ...s.headerRow }}>
          <span>Order ID</span>
          <span>Customer</span>
          <span>Payment</span>
          <span>Total</span>
          <span>Date</span>
          <span>Status</span>
          <span>Action</span>
        </div>
        {orders.length === 0 && <div style={s.empty}>No orders found.</div>}
        {orders.map(order => {
          const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending
          const needsVerify = (order.paymentMethod === 'easypaisa' || order.paymentMethod === 'jazzcash') && !order.paymentConfirmed
          return (
            <div key={order._id} style={{ ...s.row, cursor: 'pointer' }} onClick={() => openOrder(order)}>
              <span style={s.orderId}>#{order._id.slice(-6).toUpperCase()}</span>
              <div>
                <div style={s.customerName}>{order.user?.name || '—'}</div>
                <div style={s.customerEmail}>{order.user?.email || ''}</div>
              </div>
              <div>
                <div style={s.paymentMethod}>{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</div>
                {needsVerify && <div style={s.verifyBadge}>⏳ Unverified</div>}
                {order.paymentConfirmed && <div style={s.verifiedBadge}>✓ Verified</div>}
              </div>
              <span style={s.cell}>PKR {order.total?.toLocaleString()}</span>
              <span style={s.cell}>{new Date(order.createdAt).toLocaleDateString()}</span>
              <span><span style={{ ...s.badge, background: sc.bg, color: sc.color }}>{order.status}</span></span>
              <div onClick={e => e.stopPropagation()}>
                <select
                  style={s.statusSelect}
                  value={order.status}
                  onChange={e => handleStatusChange(order._id, e.target.value)}
                  disabled={updating}
                >
                  {STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Order Detail Modal ── */}
      {selected && (
        <div style={s.overlay} onClick={() => setSelected(null)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={s.modalHead}>
              <div>
                <h2 style={s.modalTitle}>Order #{selected._id.slice(-6).toUpperCase()}</h2>
                <p style={s.modalSub}>{new Date(selected.createdAt).toLocaleString()}</p>
              </div>
              <button style={s.closeBtn} onClick={() => setSelected(null)}>✕</button>
            </div>

            {/* Info grid */}
            <div style={s.modalGrid}>
              <div style={s.infoBlock}>
                <p style={s.infoLabel}>Customer</p>
                <p style={s.infoVal}>{selected.user?.name || '—'}</p>
                <p style={s.infoSub}>{selected.user?.email || ''}</p>
              </div>
              <div style={s.infoBlock}>
                <p style={s.infoLabel}>Shipping Address</p>
                {selected.shippingAddress ? (
                  <>
                    <p style={s.infoVal}>{selected.shippingAddress.fullName}</p>
                    <p style={s.infoSub}>
                      {selected.shippingAddress.address}, {selected.shippingAddress.city}<br />
                      {selected.shippingAddress.province} · {selected.shippingAddress.phone}
                    </p>
                  </>
                ) : <p style={s.infoSub}>—</p>}
              </div>
              <div style={s.infoBlock}>
                <p style={s.infoLabel}>Payment Method</p>
                <p style={s.infoVal}>{PAYMENT_LABELS[selected.paymentMethod] || selected.paymentMethod}</p>
                <p style={s.infoSub}>{selected.isPaid ? '✓ Paid' : 'Unpaid'}</p>
              </div>
              <div style={s.infoBlock}>
                <p style={s.infoLabel}>Update Status</p>
                <select
                  style={{ ...s.statusSelect, width: '100%', marginTop: 4 }}
                  value={selected.status}
                  onChange={e => handleStatusChange(selected._id, e.target.value)}
                  disabled={updating}
                >
                  {STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
                <p style={{ fontSize: 10, color: 'rgba(245,240,230,0.3)', margin: '6px 0 0', letterSpacing: '0.05em' }}>
                  ✉ Email auto-sends on confirm/ship/deliver
                </p>
              </div>
            </div>

            {/* ── Payment Screenshot Section ── */}
            {(selected.paymentMethod === 'easypaisa' || selected.paymentMethod === 'jazzcash') && (
              <div style={s.paymentSection}>
                <div style={s.paymentSectionHead}>
                  <div>
                    <p style={s.infoLabel}>{PAYMENT_LABELS[selected.paymentMethod]} Payment</p>
                    {selected.paymentConfirmed ? (
                      <p style={s.confirmedText}>
                        ✓ Payment verified on {new Date(selected.paymentConfirmedAt).toLocaleString()}
                      </p>
                    ) : (
                      <p style={s.unconfirmedText}>⏳ Payment not yet verified</p>
                    )}
                  </div>
                  {!selected.paymentConfirmed && (
                    <button
                      style={s.confirmPaymentBtn}
                      onClick={handleConfirmPayment}
                      disabled={confirmingPayment}
                    >
                      {confirmingPayment ? 'Confirming...' : '✓ Confirm Payment'}
                    </button>
                  )}
                </div>

                {/* Screenshot */}
                {selected.paymentScreenshot ? (
                  <div>
                    <p style={{ ...s.infoLabel, marginBottom: 10 }}>Payment Screenshot</p>
                    <div style={s.screenshotWrap} onClick={() => setScreenshotOpen(true)}>
                      <img
                        src={`http://localhost:5000${selected.paymentScreenshot}`}
                        alt="Payment screenshot"
                        style={s.screenshotThumb}
                      />
                      <div style={s.screenshotOverlay}>
                        <span style={s.screenshotZoom}>🔍 Click to zoom</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={s.noScreenshot}>
                    No screenshot uploaded by customer
                  </div>
                )}
              </div>
            )}

            {/* Order Items */}
            <div style={s.itemsSection}>
              <p style={s.infoLabel}>Order Items</p>
              {selected.items?.map((item, i) => (
                <div key={i} style={s.orderItem}>
                  <div style={{ ...s.colorDot, background: item.bottleColor || '#3d5c30' }} />
                  <div style={{ flex: 1 }}>
                    <span style={s.itemName}>{item.name}</span>
                    <span style={s.itemMeta}> · {item.size}</span>
                  </div>
                  <span style={s.itemQty}>×{item.quantity}</span>
                  <span style={s.itemPrice}>PKR {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={s.totals}>
              <div style={s.totalRow}><span>Subtotal</span><span>PKR {selected.subtotal?.toLocaleString()}</span></div>
              <div style={s.totalRow}><span>Shipping</span><span>{selected.shippingCharge === 0 ? 'Free' : `PKR ${selected.shippingCharge}`}</span></div>
              <div style={{ ...s.totalRow, ...s.grandTotal }}><span>Total</span><span>PKR {selected.total?.toLocaleString()}</span></div>
            </div>

            {/* Admin Notes */}
            <div style={s.notesSection}>
              <div style={s.notesHead}>
                <p style={s.infoLabel}>Admin Notes</p>
                {!editingNotes && (
                  <button style={s.notesEditBtn} onClick={() => setEditingNotes(true)}>✎ Edit</button>
                )}
              </div>
              {editingNotes ? (
                <div>
                  <textarea
                    style={s.notesTextarea}
                    value={notesValue}
                    onChange={e => setNotesValue(e.target.value)}
                    placeholder="Internal notes (not visible to customer)..."
                    rows={3}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button style={s.notesSaveBtn} onClick={handleSaveNotes} disabled={savingNotes}>
                      {savingNotes ? 'Saving...' : 'Save Notes'}
                    </button>
                    <button style={s.notesCancelBtn} onClick={() => { setEditingNotes(false); setNotesValue(selected.notes || '') }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p style={s.notesDisplay}>
                  {selected.notes || <span style={{ opacity: 0.3, fontStyle: 'italic' }}>No notes added yet.</span>}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Screenshot Lightbox ── */}
      {screenshotOpen && selected?.paymentScreenshot && (
        <div style={s.lightbox} onClick={() => setScreenshotOpen(false)}>
          <div style={s.lightboxInner} onClick={e => e.stopPropagation()}>
            <button style={s.lightboxClose} onClick={() => setScreenshotOpen(false)}>✕ Close</button>
            <img
              src={`http://localhost:5000${selected.paymentScreenshot}`}
              alt="Payment proof"
              style={s.lightboxImg}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function Loader() {
  return (
    <div style={{ padding: 80, textAlign: 'center', color: 'rgba(245,240,230,0.2)', fontSize: 14, letterSpacing: '0.2em', fontFamily: "'Jost', sans-serif" }}>
      LOADING...
    </div>
  )
}

const s = {
  eyebrow:    { fontSize: 11, letterSpacing: '0.4em', color: '#C9A96E', textTransform: 'uppercase', marginBottom: 10, fontWeight: 300 },
  pageTitle:  { fontSize: 40, color: 'rgba(245,240,230,0.9)', fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, margin: 0 },
  verifyAlert:{ fontSize: 13, color: '#E8C87A', background: 'rgba(232,200,122,0.08)', border: '1px solid rgba(232,200,122,0.2)', padding: '8px 14px', borderRadius: 8, marginTop: 10, display: 'inline-block' },
  topBar:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 16 },
  filterRow:  { display: 'flex', gap: 6, flexWrap: 'wrap' },
  filterBtn:  { background: 'none', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(245,240,230,0.35)', padding: '8px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize', fontFamily: "'Jost', sans-serif" },
  filterBtnActive: { borderColor: 'rgba(201,169,110,0.4)', color: '#C9A96E', background: 'rgba(201,169,110,0.08)' },

  tableWrap:  { background: '#161616', border: '1px solid rgba(201,169,110,0.1)', borderRadius: 12, overflow: 'hidden' },
  headerRow:  { color: 'rgba(245,240,230,0.25)', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.02)', fontWeight: 400 },
  row:        { display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.2fr 1fr 1fr 1fr 1.2fr', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center', fontSize: 14 },
  orderId:    { color: '#C9A96E', fontWeight: 600, fontFamily: 'monospace', fontSize: 13 },
  customerName:  { color: 'rgba(245,240,230,0.8)', fontSize: 14, fontWeight: 500 },
  customerEmail: { color: 'rgba(245,240,230,0.3)', fontSize: 12, marginTop: 2 },
  paymentMethod: { color: 'rgba(245,240,230,0.7)', fontSize: 13, fontWeight: 500 },
  verifyBadge:   { fontSize: 11, color: '#E8C87A', marginTop: 3 },
  verifiedBadge: { fontSize: 11, color: '#50C87A', marginTop: 3 },
  cell:       { color: 'rgba(245,240,230,0.55)', fontSize: 14 },
  badge:      { padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, textTransform: 'capitalize' },
  statusSelect: { background: '#0F0F0F', border: '1px solid rgba(201,169,110,0.15)', color: 'rgba(245,240,230,0.7)', padding: '8px 12px', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: "'Jost', sans-serif" },
  empty:      { padding: '60px 24px', textAlign: 'center', color: 'rgba(245,240,230,0.2)', fontSize: 14 },

  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 },
  modalBox:   { background: '#161616', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 16, padding: '36px', width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', fontFamily: "'Jost', sans-serif" },
  modalHead:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  modalTitle: { fontSize: 26, color: 'rgba(245,240,230,0.9)', fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, margin: 0 },
  modalSub:   { color: 'rgba(245,240,230,0.3)', fontSize: 13, margin: '4px 0 0' },
  closeBtn:   { background: 'none', border: 'none', color: 'rgba(245,240,230,0.3)', fontSize: 20, cursor: 'pointer' },
  modalGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 },
  infoBlock:  { background: '#0F0F0F', borderRadius: 10, padding: '18px 20px' },
  infoLabel:  { fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(245,240,230,0.3)', margin: '0 0 8px', display: 'block' },
  infoVal:    { fontSize: 15, color: 'rgba(245,240,230,0.85)', margin: '0 0 4px', fontWeight: 600 },
  infoSub:    { fontSize: 13, color: 'rgba(245,240,230,0.4)', margin: 0, lineHeight: 1.6 },

  // Payment section
  paymentSection:     { background: '#0F0F0F', borderRadius: 10, padding: '20px', marginBottom: 24 },
  paymentSectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  confirmedText:      { fontSize: 13, color: '#50C87A', margin: '4px 0 0', fontWeight: 500 },
  unconfirmedText:    { fontSize: 13, color: '#E8C87A', margin: '4px 0 0' },
  confirmPaymentBtn:  { background: '#50C87A', color: '#0A0A0A', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Jost', sans-serif", flexShrink: 0 },
  screenshotWrap:  { position: 'relative', display: 'inline-block', cursor: 'pointer' },
  screenshotThumb: { width: 140, height: 140, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(201,169,110,0.2)', display: 'block' },
  screenshotOverlay:{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' },
  screenshotZoom:  { color: '#fff', fontSize: 12, fontWeight: 500 },
  noScreenshot:    { fontSize: 13, color: 'rgba(245,240,230,0.25)', fontStyle: 'italic', padding: '16px 0' },

  itemsSection: { marginBottom: 20 },
  orderItem:  { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  colorDot:   { width: 28, height: 28, borderRadius: 6, flexShrink: 0 },
  itemName:   { color: 'rgba(245,240,230,0.85)', fontSize: 14, fontWeight: 500 },
  itemMeta:   { color: 'rgba(245,240,230,0.35)', fontSize: 13 },
  itemQty:    { color: 'rgba(245,240,230,0.4)', fontSize: 14, minWidth: 30, textAlign: 'right' },
  itemPrice:  { color: '#C9A96E', fontSize: 14, minWidth: 100, textAlign: 'right', fontWeight: 600 },

  totals:     { background: '#0F0F0F', borderRadius: 10, padding: '18px 20px', marginBottom: 20 },
  totalRow:   { display: 'flex', justifyContent: 'space-between', padding: '7px 0', color: 'rgba(245,240,230,0.45)', fontSize: 14 },
  grandTotal: { borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8, paddingTop: 12, color: 'rgba(245,240,230,0.9)', fontWeight: 700, fontSize: 16 },

  notesSection:  { background: '#0F0F0F', borderRadius: 10, padding: '18px 20px' },
  notesHead:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  notesEditBtn:  { background: 'none', border: 'none', color: '#C9A96E', fontSize: 13, cursor: 'pointer', letterSpacing: '0.1em' },
  notesTextarea: { width: '100%', background: '#161616', border: '1px solid rgba(201,169,110,0.2)', borderRadius: 8, padding: '12px 16px', color: 'rgba(245,240,230,0.8)', fontSize: 14, fontFamily: "'Jost', sans-serif", resize: 'vertical', outline: 'none', boxSizing: 'border-box' },
  notesSaveBtn:  { background: '#C9A96E', color: '#0A0A0A', border: 'none', padding: '9px 22px', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Jost', sans-serif" },
  notesCancelBtn:{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(245,240,230,0.35)', padding: '9px 18px', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: "'Jost', sans-serif" },
  notesDisplay:  { fontSize: 14, color: 'rgba(245,240,230,0.55)', lineHeight: 1.7, margin: 0 },

  // Lightbox
  lightbox:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 },
  lightboxInner: { position: 'relative', maxWidth: '90vw', maxHeight: '90vh' },
  lightboxClose: { position: 'absolute', top: -40, right: 0, background: 'none', border: 'none', color: 'rgba(245,240,230,0.6)', fontSize: 14, cursor: 'pointer', letterSpacing: '0.1em', fontFamily: "'Jost', sans-serif" },
  lightboxImg:   { maxWidth: '85vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8 },
}