import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'

const API = 'http://localhost:5000/api'

const EMPTY = { name: '', discountType: 'percentage', discountValue: '', appliesTo: 'all', startsAt: '', endsAt: '' }

export default function AdminSales() {
  const { token } = useAuth()
  const [sales, setSales]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const headers = { Authorization: `Bearer ${token}` }

  const fetch = async () => {
    try {
      const res = await axios.get(`${API}/sales/all`, { headers })
      setSales(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSave = async () => {
    if (!form.name || !form.discountValue) { setError('Name and discount value are required'); return }
    setSaving(true); setError('')
    try {
      await axios.post(`${API}/sales`, { ...form, discountValue: Number(form.discountValue) }, { headers })
      setModal(false); setForm(EMPTY); fetch()
    } catch (e) { setError(e.response?.data?.message || 'Failed to create sale') }
    finally { setSaving(false) }
  }

  const handleToggle = async (id) => {
    try { await axios.put(`${API}/sales/${id}/toggle`, {}, { headers }); fetch() }
    catch (e) { console.error(e) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this sale?')) return
    try { await axios.delete(`${API}/sales/${id}`, { headers }); fetch() }
    catch (e) { console.error(e) }
  }

  if (loading) return <Loader />

  const activeSale = sales.find(s => s.isActive)

  return (
    <div>
      <div style={s.topBar}>
        <div>
          <p style={s.eyebrow}>AEVUM · Admin</p>
          <h1 style={s.pageTitle}>Sales & Discounts</h1>
        </div>
        <button style={s.addBtn} onClick={() => { setForm(EMPTY); setError(''); setModal(true) }}>
          + Create Sale
        </button>
      </div>

      {/* Active Sale Banner */}
      {activeSale && (
        <div style={s.activeBanner}>
          <div style={s.activeDot} />
          <div style={{ flex: 1 }}>
            <p style={s.activeName}>🏷 Active Sale: {activeSale.name}</p>
            <p style={s.activeSub}>
              {activeSale.discountType === 'percentage'
                ? `${activeSale.discountValue}% off`
                : `PKR ${activeSale.discountValue} off`}
              {' · '}Applies to {activeSale.appliesTo === 'all' ? 'all products' : 'selected products'}
            </p>
          </div>
          <button style={s.deactivateBtn} onClick={() => handleToggle(activeSale._id)}>
            Deactivate
          </button>
        </div>
      )}

      {/* Sales Table */}
      <div style={s.tableWrap}>
        <div style={{ ...s.row, ...s.headerRow }}>
          <span>Sale Name</span><span>Type</span><span>Discount</span>
          <span>Applies To</span><span>Status</span><span>Actions</span>
        </div>
        {sales.length === 0 && (
          <div style={s.empty}>No sales created yet. Create one to start a promotion!</div>
        )}
        {sales.map(sale => (
          <div key={sale._id} style={s.row}>
            <div>
              <p style={s.saleName}>{sale.name}</p>
              {sale.startsAt && (
                <p style={s.saleMeta}>
                  {new Date(sale.startsAt).toLocaleDateString()} –{' '}
                  {sale.endsAt ? new Date(sale.endsAt).toLocaleDateString() : 'No end date'}
                </p>
              )}
            </div>
            <span style={s.cell}>
              {sale.discountType === 'percentage' ? '% Percentage' : '₨ Fixed PKR'}
            </span>
            <span style={{ ...s.cell, color: '#C9A96E', fontWeight: 700, fontSize: 18 }}>
              {sale.discountType === 'percentage'
                ? `${sale.discountValue}%`
                : `PKR ${sale.discountValue.toLocaleString()}`}
            </span>
            <span style={s.cell}>
              {sale.appliesTo === 'all' ? 'All Products' : 'Selected'}
            </span>
            <span>
              <span style={{ ...s.badge, ...(sale.isActive ? s.badgeActive : s.badgeInactive) }}>
                {sale.isActive ? '● Live' : '○ Inactive'}
              </span>
            </span>
            <div style={s.actions}>
              <button
                style={{ ...s.toggleBtn, ...(sale.isActive ? s.deactivateSmall : s.activateSmall) }}
                onClick={() => handleToggle(sale._id)}
              >
                {sale.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button style={s.delBtn} onClick={() => handleDelete(sale._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div style={s.infoBox}>
        <p style={s.infoTitle}>How Sales Work</p>
        <p style={s.infoText}>
          Only <strong style={{ color: '#C9A96E' }}>one sale can be active at a time</strong>. Activating a new sale automatically deactivates any existing one.
          The discount is applied automatically on the checkout page when a sale is active.
          <br /><br />
          <strong style={{ color: 'rgba(245,240,230,0.7)' }}>Percentage</strong> — e.g. 20% off means PKR 4,500 becomes PKR 3,600.<br />
          <strong style={{ color: 'rgba(245,240,230,0.7)' }}>Fixed PKR</strong> — e.g. PKR 500 off means PKR 4,500 becomes PKR 4,000.
        </p>
      </div>

      {/* Create Modal */}
      {modal && (
        <div style={s.overlay} onClick={() => setModal(false)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <div style={s.modalHead}>
              <h2 style={s.modalTitle}>Create New Sale</h2>
              <button style={s.closeBtn} onClick={() => setModal(false)}>✕</button>
            </div>

            {error && <div style={s.errorBox}>{error}</div>}

            <div style={s.formGrid}>
              <label style={{ ...s.field, gridColumn: '1 / -1' }}>
                <span style={s.fieldLabel}>Sale Name *</span>
                <input style={s.input} name="name" value={form.name} onChange={handleChange} placeholder='e.g. "Eid Special" or "Summer Sale"' />
              </label>

              <label style={s.field}>
                <span style={s.fieldLabel}>Discount Type *</span>
                <select style={s.input} name="discountType" value={form.discountType} onChange={handleChange}>
                  <option value="percentage">Percentage (% off)</option>
                  <option value="fixed">Fixed Amount (PKR off)</option>
                </select>
              </label>

              <label style={s.field}>
                <span style={s.fieldLabel}>
                  {form.discountType === 'percentage' ? 'Percentage (0–100) *' : 'PKR Amount Off *'}
                </span>
                <input style={s.input} name="discountValue" type="number" value={form.discountValue} onChange={handleChange}
                  placeholder={form.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
                  min="0" max={form.discountType === 'percentage' ? '100' : undefined}
                />
              </label>

              <label style={s.field}>
                <span style={s.fieldLabel}>Applies To</span>
                <select style={s.input} name="appliesTo" value={form.appliesTo} onChange={handleChange}>
                  <option value="all">All Products</option>
                </select>
              </label>

              <label style={s.field}>
                <span style={s.fieldLabel}>Start Date (optional)</span>
                <input style={s.input} name="startsAt" type="date" value={form.startsAt} onChange={handleChange} />
              </label>

              <label style={s.field}>
                <span style={s.fieldLabel}>End Date (optional)</span>
                <input style={s.input} name="endsAt" type="date" value={form.endsAt} onChange={handleChange} />
              </label>
            </div>

            {/* Preview */}
            {form.discountValue && (
              <div style={s.previewBox}>
                <p style={s.previewLabel}>Preview</p>
                <p style={s.previewText}>
                  A product priced at <strong style={{ color: '#C9A96E' }}>PKR 4,500</strong> will become{' '}
                  <strong style={{ color: '#7AB87A', fontSize: 18 }}>
                    PKR {form.discountType === 'percentage'
                      ? Math.round(4500 * (1 - Number(form.discountValue) / 100)).toLocaleString()
                      : Math.max(0, 4500 - Number(form.discountValue)).toLocaleString()
                    }
                  </strong>
                </p>
              </div>
            )}

            <div style={s.modalFoot}>
              <button style={s.cancelBtn} onClick={() => setModal(false)}>Cancel</button>
              <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? 'Creating...' : 'Create Sale'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Loader() {
  return <div style={{ padding: 80, textAlign: 'center', color: 'rgba(245,240,230,0.2)', fontSize: 14, letterSpacing: '0.2em' }}>LOADING...</div>
}

const s = {
  eyebrow:   { fontSize: 11, letterSpacing: '0.4em', color: '#C9A96E', textTransform: 'uppercase', marginBottom: 10, fontWeight: 300 },
  pageTitle: { fontSize: 40, color: 'rgba(245,240,230,0.9)', fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, margin: 0 },
  topBar:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 },
  addBtn:    { background: '#C9A96E', color: '#0A0A0A', border: 'none', padding: '14px 28px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },

  activeBanner: { background: 'rgba(80,200,122,0.08)', border: '1px solid rgba(80,200,122,0.25)', borderRadius: 12, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 },
  activeDot:    { width: 12, height: 12, borderRadius: '50%', background: '#50C87A', flexShrink: 0, boxShadow: '0 0 8px rgba(80,200,122,0.6)' },
  activeName:   { fontSize: 16, color: 'rgba(245,240,230,0.9)', fontWeight: 600, margin: 0 },
  activeSub:    { fontSize: 13, color: 'rgba(245,240,230,0.45)', margin: '4px 0 0' },
  deactivateBtn:{ background: 'rgba(200,80,80,0.1)', color: '#E87A7A', border: '1px solid rgba(200,80,80,0.3)', padding: '10px 20px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600 },

  tableWrap: { background: '#161616', border: '1px solid rgba(201,169,110,0.1)', borderRadius: 12, overflow: 'hidden', marginBottom: 24 },
  headerRow: { color: 'rgba(245,240,230,0.3)', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.02)', fontWeight: 400 },
  row:       { display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr 1.5fr', padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center', fontSize: 14 },
  saleName:  { color: 'rgba(245,240,230,0.85)', fontWeight: 600, fontSize: 15, margin: 0 },
  saleMeta:  { color: 'rgba(245,240,230,0.3)', fontSize: 12, margin: '4px 0 0' },
  cell:      { color: 'rgba(245,240,230,0.6)', fontSize: 14 },
  badge:     { padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  badgeActive:   { background: 'rgba(80,200,122,0.12)', color: '#50C87A' },
  badgeInactive: { background: 'rgba(255,255,255,0.05)', color: 'rgba(245,240,230,0.3)' },
  actions:   { display: 'flex', gap: 8 },
  toggleBtn: { padding: '8px 16px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600, border: '1px solid' },
  activateSmall:   { background: 'rgba(80,200,122,0.1)', color: '#50C87A', borderColor: 'rgba(80,200,122,0.3)' },
  deactivateSmall: { background: 'rgba(200,80,80,0.08)', color: '#E87A7A', borderColor: 'rgba(200,80,80,0.2)' },
  delBtn:    { background: 'rgba(200,80,80,0.08)', color: '#E87A7A', border: '1px solid rgba(200,80,80,0.2)', padding: '8px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer' },
  empty:     { padding: '60px 24px', textAlign: 'center', color: 'rgba(245,240,230,0.2)', fontSize: 14 },

  infoBox:   { background: '#161616', border: '1px solid rgba(201,169,110,0.1)', borderRadius: 12, padding: '24px 28px' },
  infoTitle: { fontSize: 14, color: '#C9A96E', fontWeight: 600, margin: '0 0 10px', letterSpacing: '0.05em' },
  infoText:  { fontSize: 14, color: 'rgba(245,240,230,0.4)', lineHeight: 1.8, margin: 0 },

  overlay:   { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 },
  modalBox:  { background: '#161616', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 16, padding: '36px', width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' },
  modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  modalTitle:{ fontSize: 26, color: 'rgba(245,240,230,0.9)', fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, margin: 0 },
  closeBtn:  { background: 'none', border: 'none', color: 'rgba(245,240,230,0.3)', fontSize: 20, cursor: 'pointer' },
  errorBox:  { background: 'rgba(200,80,80,0.1)', border: '1px solid rgba(200,80,80,0.3)', color: '#E87A7A', padding: '12px 16px', borderRadius: 8, fontSize: 14, marginBottom: 20 },
  formGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 },
  field:     { display: 'flex', flexDirection: 'column', gap: 8 },
  fieldLabel:{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,240,230,0.4)' },
  input:     { background: '#0F0F0F', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 8, padding: '12px 16px', color: 'rgba(245,240,230,0.8)', fontSize: 14, outline: 'none', fontFamily: "'Jost', sans-serif", width: '100%', boxSizing: 'border-box' },
  previewBox:{ background: 'rgba(201,169,110,0.05)', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 10, padding: '16px 20px', marginBottom: 24 },
  previewLabel:{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(245,240,230,0.3)', margin: '0 0 8px' },
  previewText: { fontSize: 15, color: 'rgba(245,240,230,0.6)', margin: 0, lineHeight: 1.7 },
  modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(245,240,230,0.45)', padding: '12px 28px', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  saveBtn:   { background: '#C9A96E', color: '#0A0A0A', border: 'none', padding: '12px 32px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
}