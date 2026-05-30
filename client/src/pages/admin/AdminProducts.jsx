import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'

const API = 'http://localhost:5000/api'

const EMPTY_FORM = {
  name: '', tagline: '', description: '', category: '',
  gender: 'For Him', filterKey: 'him',
  price: '', sizes: '50ml, 100ml', badge: '',
  notes: '', topNotes: '', heartNotes: '', baseNotes: '',
  bg: 'linear-gradient(160deg, #1a2a1a 0%, #3d5c30 60%, #0d1a0d 100%)',
  bottleColor: '#3d5c30', accent: '#9AAD84', stock: 100,
}

export default function AdminProducts() {
  const { token } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [seeding, setSeeding]   = useState(false)
  const [seedMsg, setSeedMsg]   = useState('')
  const [error, setError]       = useState('')
  const [deleteId, setDeleteId] = useState(null)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API}/products/admin/all`, { headers })
      setProducts(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchProducts() }, [])

  const handleSeed = async () => {
    setSeeding(true); setSeedMsg('')
    try {
      const res = await axios.post(`${API}/products/seed`, {}, { headers })
      setSeedMsg(`✓ ${res.data.message}`)
      fetchProducts()
    } catch (e) {
      setSeedMsg(e.response?.data?.message || 'Seed failed')
    } finally { setSeeding(false) }
  }

  const openAdd  = () => { setForm(EMPTY_FORM); setError(''); setModal('add') }
  const openEdit = (p) => {
    setForm({
      ...p,
      sizes:      p.sizes?.join(', ')      || '',
      notes:      p.notes?.join(', ')      || '',
      topNotes:   p.topNotes?.join(', ')   || '',
      heartNotes: p.heartNotes?.join(', ') || '',
      baseNotes:  p.baseNotes?.join(', ')  || '',
    })
    setError(''); setModal('edit')
  }

  const handleChange = e => {
    const { name, value } = e.target
    const updates = { [name]: value }
    if (name === 'gender') {
      updates.filterKey = value === 'For Him' ? 'him' : value === 'For Her' ? 'her' : 'unisex'
    }
    setForm(f => ({ ...f, ...updates }))
  }

  const toArray = str => str.split(',').map(s => s.trim()).filter(Boolean)

  const handleSave = async () => {
    setError(''); setSaving(true)
    const payload = {
      ...form,
      price:      Number(form.price),
      stock:      Number(form.stock),
      sizes:      toArray(form.sizes),
      notes:      toArray(form.notes),
      topNotes:   toArray(form.topNotes),
      heartNotes: toArray(form.heartNotes),
      baseNotes:  toArray(form.baseNotes),
    }
    try {
      if (modal === 'add') {
        await axios.post(`${API}/products`, payload, { headers })
      } else {
        await axios.put(`${API}/products/${form._id}`, payload, { headers })
      }
      setModal(null); fetchProducts()
    } catch (e) {
      setError(e.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/products/${deleteId}`, { headers })
      setDeleteId(null); fetchProducts()
    } catch (e) { console.error(e) }
  }

  if (loading) return <Loader />

  return (
    <div>
      <div style={s.topBar}>
        <div>
          <p style={s.eyebrow}>AEVUM · Admin</p>
          <h1 style={s.pageTitle}>Products</h1>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Seed Button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <button style={s.seedBtn} onClick={handleSeed} disabled={seeding}>
              {seeding ? 'Seeding...' : '⟳ Seed Default Products'}
            </button>
            {seedMsg && (
              <span style={{
                fontSize: 11,
                color: seedMsg.startsWith('✓') ? '#7AB87A' : '#E87A7A',
              }}>
                {seedMsg}
              </span>
            )}
          </div>
          <button style={s.addBtn} onClick={openAdd}>+ Add Product</button>
        </div>
      </div>

      <div style={s.tableWrap}>
        <div style={{ ...s.row, ...s.headerRow }}>
          <span>Product</span><span>Category</span><span>Price</span>
          <span>Stock</span><span>Status</span><span>Actions</span>
        </div>
        {products.length === 0 && <div style={s.empty}>No products yet. Seed or add one!</div>}
        {products.map(p => (
          <div key={p._id} style={s.row}>
            <div style={s.productCell}>
              <div style={{ ...s.colorDot, background: p.bottleColor }} />
              <div>
                <div style={s.productName}>{p.name}</div>
                <div style={s.productSub}>{p.gender}</div>
              </div>
            </div>
            <span style={s.cell}>{p.category}</span>
            <span style={s.cell}>PKR {p.price?.toLocaleString()}</span>
            <span style={{
              ...s.cell,
              color: p.stock === 0 ? '#E87A7A' : p.stock <= 10 ? '#E8C87A' : 'rgba(245,240,230,0.55)',
              fontWeight: p.stock <= 10 ? 600 : 400,
            }}>
              {p.stock === 0 ? '⚠ Out of stock' : p.stock <= 10 ? `⚠ ${p.stock} left` : p.stock}
            </span>
            <span>
              <span style={{ ...s.badge, ...(p.isActive ? s.badgeActive : s.badgeInactive) }}>
                {p.isActive ? 'Active' : 'Hidden'}
              </span>
            </span>
            <div style={s.actions}>
              <button style={s.editBtn} onClick={() => openEdit(p)}>Edit</button>
              <button style={s.delBtn}  onClick={() => setDeleteId(p._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <div style={s.overlay} onClick={() => setModal(null)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <div style={s.modalHead}>
              <h2 style={s.modalTitle}>{modal === 'add' ? 'Add New Product' : `Edit — ${form.name}`}</h2>
              <button style={s.closeBtn} onClick={() => setModal(null)}>✕</button>
            </div>

            {error && <div style={s.errorBox}>{error}</div>}

            <div style={s.formGrid}>
              {[
                { label: 'Name',                    name: 'name',        placeholder: 'Aurum' },
                { label: 'Tagline',                 name: 'tagline',     placeholder: 'The Gold Standard' },
                { label: 'Category',                name: 'category',    placeholder: 'Woody Oud' },
                { label: 'Price (PKR)',              name: 'price',       placeholder: '4500', type: 'number' },
                { label: 'Stock',                   name: 'stock',       placeholder: '100',  type: 'number' },
                { label: 'Sizes (comma separated)', name: 'sizes',       placeholder: '50ml, 100ml' },
                { label: 'Notes (comma separated)', name: 'notes',       placeholder: 'Oud, Amber' },
                { label: 'Top Notes',               name: 'topNotes',    placeholder: 'Saffron, Bergamot' },
                { label: 'Heart Notes',             name: 'heartNotes',  placeholder: 'Oud, Cedarwood' },
                { label: 'Base Notes',              name: 'baseNotes',   placeholder: 'Amber, Musk' },
                { label: 'Bottle Color (hex)',      name: 'bottleColor', placeholder: '#3d5c30' },
                { label: 'Accent Color (hex)',      name: 'accent',      placeholder: '#9AAD84' },
              ].map(field => (
                <label key={field.name} style={s.field}>
                  <span style={s.fieldLabel}>{field.label}</span>
                  <input style={s.input} type={field.type || 'text'} name={field.name} value={form[field.name] || ''} onChange={handleChange} placeholder={field.placeholder} />
                </label>
              ))}

              <label style={s.field}>
                <span style={s.fieldLabel}>Gender</span>
                <select style={s.input} name="gender" value={form.gender} onChange={handleChange}>
                  <option>For Him</option><option>For Her</option><option>Unisex</option>
                </select>
              </label>

              <label style={s.field}>
                <span style={s.fieldLabel}>Badge</span>
                <select style={s.input} name="badge" value={form.badge} onChange={handleChange}>
                  <option value="">None</option>
                  <option value="bestseller">Bestseller</option>
                  <option value="new">New</option>
                  <option value="limited">Limited</option>
                </select>
              </label>

              {modal === 'edit' && (
                <label style={s.field}>
                  <span style={s.fieldLabel}>Visibility</span>
                  <select style={s.input} name="isActive" value={form.isActive ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, isActive: e.target.value === 'true' }))}>
                    <option value="true">Active</option>
                    <option value="false">Hidden</option>
                  </select>
                </label>
              )}

              <label style={{ ...s.field, gridColumn: '1 / -1' }}>
                <span style={s.fieldLabel}>Description</span>
                <textarea style={{ ...s.input, height: 90, resize: 'vertical' }} name="description" value={form.description || ''} onChange={handleChange} placeholder="Product description..." />
              </label>

              <label style={{ ...s.field, gridColumn: '1 / -1' }}>
                <span style={s.fieldLabel}>Background Gradient (CSS)</span>
                <input style={s.input} name="bg" value={form.bg || ''} onChange={handleChange} placeholder="linear-gradient(...)" />
              </label>
            </div>

            <div style={s.modalFoot}>
              <button style={s.cancelBtn} onClick={() => setModal(null)}>Cancel</button>
              <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : modal === 'add' ? 'Add Product' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div style={s.overlay} onClick={() => setDeleteId(null)}>
          <div style={{ ...s.modalBox, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Remove Product?</h2>
            <p style={{ color: 'rgba(245,240,230,0.45)', fontSize: 13, margin: '16px 0 28px' }}>
              This will hide the product from the store. Existing orders are preserved.
            </p>
            <div style={s.modalFoot}>
              <button style={s.cancelBtn} onClick={() => setDeleteId(null)}>Cancel</button>
              <button style={{ ...s.saveBtn, background: '#8B2020' }} onClick={handleDelete}>Remove</button>
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
  eyebrow:   { fontSize: 10, letterSpacing: '0.4em', color: '#C9A96E', textTransform: 'uppercase', marginBottom: 10, fontWeight: 300 },
  pageTitle: { fontSize: 36, color: 'rgba(245,240,230,0.9)', fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, margin: 0 },
  topBar:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 },
  addBtn:    { background: '#C9A96E', color: '#0A0A0A', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.05em' },
  seedBtn:   { background: 'rgba(201,169,110,0.1)', color: '#C9A96E', border: '1px solid rgba(201,169,110,0.25)', padding: '11px 20px', borderRadius: 8, fontSize: 12, cursor: 'pointer', letterSpacing: '0.05em' },
  tableWrap: { background: '#161616', border: '1px solid rgba(201,169,110,0.1)', borderRadius: 12, overflow: 'hidden' },
  headerRow: { color: 'rgba(245,240,230,0.25)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.02)', fontWeight: 400 },
  row:       { display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 0.8fr 1.2fr', padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center', fontSize: 13 },
  productCell: { display: 'flex', alignItems: 'center', gap: 12 },
  colorDot:  { width: 28, height: 28, borderRadius: 8, flexShrink: 0 },
  productName: { color: 'rgba(245,240,230,0.85)', fontWeight: 500, fontSize: 13 },
  productSub:  { color: 'rgba(245,240,230,0.3)', fontSize: 11, marginTop: 2 },
  cell:      { color: 'rgba(245,240,230,0.55)', fontSize: 13 },
  badge:     { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500 },
  badgeActive:   { background: 'rgba(80,180,100,0.12)', color: '#50C87A' },
  badgeInactive: { background: 'rgba(200,80,80,0.12)',  color: '#E87A7A' },
  actions:   { display: 'flex', gap: 8 },
  editBtn:   { background: 'rgba(201,169,110,0.1)', color: '#C9A96E', border: '1px solid rgba(201,169,110,0.2)', padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer' },
  delBtn:    { background: 'rgba(200,80,80,0.08)', color: '#E87A7A', border: '1px solid rgba(200,80,80,0.2)', padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer' },
  empty:     { padding: '60px 24px', textAlign: 'center', color: 'rgba(245,240,230,0.2)', fontSize: 13 },
  overlay:   { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 },
  modalBox:  { background: '#161616', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 16, padding: '32px', width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto' },
  modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle:{ fontSize: 22, color: 'rgba(245,240,230,0.9)', fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, margin: 0 },
  closeBtn:  { background: 'none', border: 'none', color: 'rgba(245,240,230,0.3)', fontSize: 18, cursor: 'pointer' },
  errorBox:  { background: 'rgba(200,80,80,0.1)', border: '1px solid rgba(200,80,80,0.3)', color: '#E87A7A', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 20 },
  formGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 },
  field:     { display: 'flex', flexDirection: 'column', gap: 6 },
  fieldLabel:{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,240,230,0.35)' },
  input:     { background: '#0F0F0F', border: '1px solid rgba(201,169,110,0.15)', borderRadius: 8, padding: '10px 14px', color: 'rgba(245,240,230,0.8)', fontSize: 13, outline: 'none', fontFamily: "'Jost', sans-serif", width: '100%', boxSizing: 'border-box' },
  modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(245,240,230,0.45)', padding: '10px 24px', borderRadius: 8, fontSize: 13, cursor: 'pointer' },
  saveBtn:   { background: '#C9A96E', color: '#0A0A0A', border: 'none', padding: '10px 28px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
}