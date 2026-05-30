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

export default function AdminOrders() {
  const { token } = useAuth()
  const [orders, setOrders]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [selected, setSelected]       = useState(null)
  const [updating, setUpdating]       = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue]   = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

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

  const openOrder = (order) => {
    setSelected(order)
    setNotesValue(order.notes || '')
    setEditingNotes(false)
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      // We use the status update endpoint but only pass notes
      await axios.put(
        `${API}/orders/${selected._id}/status`,
        { status: selected.status, notes: notesValue },
        { headers }
      )
      setSelected(prev => ({ ...prev, notes: notesValue }))
      setEditingNotes(false)
      fetchOrders()
    } catch (e) { console.error(e) }
    finally { setSavingNotes(false) }
  }

  if (loading) return <Loader />

  return (
    <div>
      <div style={s.topBar}>
        <div>
          <p style={s.eyebrow}>AEVUM · Admin</p>
          <h1 style={s.pageTitle}>Orders</h1>
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
          <span>Order ID</span><span>Customer</span><span>Items</span>
          <span>Total</span><span>Date</span><span>Status</span><span>Action</span>
        </div>
        {orders.length === 0 && <div style={s.empty}>No orders found.</div>}
        {orders.map(order => {
          const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending
          return (
            <div key={order._id} style={{ ...s.row, cursor: 'pointer' }} onClick={() => openOrder(order)}>
              <span style={s.orderId}>#{order._id.slice(-6).toUpperCase()}</span>
              <div>
                <div style={s.customerName}>{order.user?.name || '—'}</div>
                <div style={s.customerEmail}>{order.user?.email || ''}</div>
              </div>
              <span style={s.cell}>{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</span>
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

      {/* Order Detail Modal */}
      {selected && (
        <div style={s.overlay} onClick={() => setSelected(null)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <div style={s.modalHead}>
              <div>
                <h2 style={s.modalTitle}>Order #{selected._id.slice(-6).toUpperCase()}</h2>
                <p style={s.modalSub}>{new Date(selected.createdAt).toLocaleString()}</p>
              </div>
              <button style={s.closeBtn} onClick={() => setSelected(null)}>✕</button>
            </div>

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
                <p style={s.infoLabel}>Payment</p>
                <p style={s.infoVal}>{selected.paymentMethod?.toUpperCase()}</p>
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
              </div>
            </div>

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

            {/* ── Order Notes (editable) ── */}
            <div style={s.notesSection}>
              <div style={s.notesHead}>
                <p style={s.infoLabel}>Admin Notes</p>
                {!editingNotes && (
                  <button style={s.notesEditBtn} onClick={() => setEditingNotes(true)}>
                    ✎ Edit
                  </button>
                )}
              </div>

              {editingNotes ? (
                <div>
                  <textarea
                    style={s.notesTextarea}
                    value={notesValue}
                    onChange={e => setNotesValue(e.target.value)}
                    placeholder="Add internal notes about this order (not visible to customer)..."
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
    </div>
  )
}

function Loader() {
  return <div style={{ padding: 80, textAlign: 'center', color: 'rgba(245,240,230,0.2)', fontSize: 13, letterSpacing: '0.2em' }}>LOADING...</div>
}

const s = {
  eyebrow:    { fontSize: 10, letterSpacing: '0.4em', color: '#C9A96E', textTransform: 'uppercase', marginBottom: 10, fontWeight: 300 },
  pageTitle:  { fontSize: 36, color: 'rgba(245,240,230,0.9)', fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, margin: 0 },
  topBar:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 16 },
  filterRow:  { display: 'flex', gap: 6, flexWrap: 'wrap' },
  filterBtn:  { background: 'none', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(245,240,230,0.35)', padding: '7px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize' },
  filterBtnActive: { borderColor: 'rgba(201,169,110,0.4)', color: '#C9A96E', background: 'rgba(201,169,110,0.08)' },
  tableWrap:  { background: '#161616', border: '1px solid rgba(201,169,110,0.1)', borderRadius: 12, overflow: 'hidden' },
  headerRow:  { color: 'rgba(245,240,230,0.25)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.02)', fontWeight: 400 },
  row:        { display: 'grid', gridTemplateColumns: '1fr 1.5fr 0.8fr 1fr 1fr 1fr 1.2fr', padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center', fontSize: 13 },
  orderId:    { color: '#C9A96E', fontWeight: 500, fontFamily: 'monospace', fontSize: 12 },
  customerName:  { color: 'rgba(245,240,230,0.75)', fontSize: 13, fontWeight: 500 },
  customerEmail: { color: 'rgba(245,240,230,0.3)', fontSize: 11, marginTop: 2 },
  cell:       { color: 'rgba(245,240,230,0.55)' },
  badge:      { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, textTransform: 'capitalize' },
  statusSelect: { background: '#0F0F0F', border: '1px solid rgba(201,169,110,0.15)', color: 'rgba(245,240,230,0.7)', padding: '6px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: "'Jost', sans-serif" },
  empty:      { padding: '60px 24px', textAlign: 'center', color: 'rgba(245,240,230,0.2)', fontSize: 13 },
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 },
  modalBox:   { background: '#161616', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 16, padding: '32px', width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' },
  modalHead:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  modalTitle: { fontSize: 22, color: 'rgba(245,240,230,0.9)', fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, margin: 0 },
  modalSub:   { color: 'rgba(245,240,230,0.3)', fontSize: 12, margin: '4px 0 0' },
  closeBtn:   { background: 'none', border: 'none', color: 'rgba(245,240,230,0.3)', fontSize: 18, cursor: 'pointer' },
  modalGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 },
  infoBlock:  { background: '#0F0F0F', borderRadius: 10, padding: '16px 18px' },
  infoLabel:  { fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(245,240,230,0.3)', margin: '0 0 8px', display: 'block' },
  infoVal:    { fontSize: 14, color: 'rgba(245,240,230,0.8)', margin: '0 0 4px', fontWeight: 500 },
  infoSub:    { fontSize: 12, color: 'rgba(245,240,230,0.4)', margin: 0, lineHeight: 1.6 },
  itemsSection: { marginBottom: 20 },
  orderItem:  { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  colorDot:   { width: 24, height: 24, borderRadius: 6, flexShrink: 0 },
  itemName:   { color: 'rgba(245,240,230,0.8)', fontSize: 13, fontWeight: 500 },
  itemMeta:   { color: 'rgba(245,240,230,0.35)', fontSize: 12 },
  itemQty:    { color: 'rgba(245,240,230,0.4)', fontSize: 13, minWidth: 30, textAlign: 'right' },
  itemPrice:  { color: '#C9A96E', fontSize: 13, minWidth: 100, textAlign: 'right' },
  totals:     { background: '#0F0F0F', borderRadius: 10, padding: '16px 18px', marginBottom: 20 },
  totalRow:   { display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: 'rgba(245,240,230,0.45)', fontSize: 13 },
  grandTotal: { borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8, paddingTop: 12, color: 'rgba(245,240,230,0.85)', fontWeight: 600, fontSize: 15 },

  notesSection:  { background: '#0F0F0F', borderRadius: 10, padding: '16px 18px' },
  notesHead:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  notesEditBtn:  { background: 'none', border: 'none', color: '#C9A96E', fontSize: 12, cursor: 'pointer', letterSpacing: '0.1em' },
  notesTextarea: { width: '100%', background: '#161616', border: '1px solid rgba(201,169,110,0.2)', borderRadius: 8, padding: '10px 14px', color: 'rgba(245,240,230,0.8)', fontSize: 13, fontFamily: "'Jost', sans-serif", resize: 'vertical', outline: 'none', boxSizing: 'border-box' },
  notesSaveBtn:  { background: '#C9A96E', color: '#0A0A0A', border: 'none', padding: '8px 20px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  notesCancelBtn:{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(245,240,230,0.35)', padding: '8px 16px', borderRadius: 6, fontSize: 12, cursor: 'pointer' },
  notesDisplay:  { fontSize: 13, color: 'rgba(245,240,230,0.55)', lineHeight: 1.6, margin: 0 },
}