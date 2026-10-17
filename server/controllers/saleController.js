const Sale = require('../models/Sale')
const { cleanText, isObjectId } = require('../utils/validate')

const DISCOUNT_TYPES = ['percentage', 'fixed']
const APPLIES_TO = ['all', 'selected']

const toDate = (v) => {
  if (v === '' || v === null || v === undefined) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? undefined : d
}

function buildSaleData(body, { partial }) {
  const data = {}
  const has = (k) => Object.prototype.hasOwnProperty.call(body, k)
  const need = (k) => !partial || has(k)

  if (need('name')) {
    data.name = cleanText(body.name, 80)
    if (!data.name) return { error: 'Sale name is required' }
  }
  if (need('discountType')) {
    if (!DISCOUNT_TYPES.includes(body.discountType)) return { error: 'Invalid discount type' }
    data.discountType = body.discountType
  }
  if (need('discountValue')) {
    const v = Number(body.discountValue)
    if (!Number.isFinite(v) || v < 0 || v > 10000000) return { error: 'Invalid discount value' }
    data.discountValue = v
  }
  const type = data.discountType || body.discountType
  if (data.discountValue !== undefined && type === 'percentage' && data.discountValue > 100) {
    return { error: 'Percentage discount cannot exceed 100' }
  }
  if (has('appliesTo')) {
    if (!APPLIES_TO.includes(body.appliesTo)) return { error: 'Invalid appliesTo' }
    data.appliesTo = body.appliesTo
  }
  if (has('products')) {
    const list = Array.isArray(body.products) ? body.products : []
    if (!list.every(isObjectId)) return { error: 'Invalid product id' }
    data.products = list.slice(0, 200)
  }
  if (has('isActive')) data.isActive = body.isActive === true
  for (const k of ['startsAt', 'endsAt']) {
    if (has(k)) {
      const d = toDate(body[k])
      if (d === undefined) return { error: `Invalid ${k} date` }
      data[k] = d
    }
  }
  return { data }
}

// GET /api/sales — public, returns active sale if any
const getActiveSale = async (req, res) => {
  try {
    const sale = await Sale.findOne({ isActive: true })
    res.json(sale || null)
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /api/sales/all — admin
const getAllSales = async (req, res) => {
  try {
    res.json(await Sale.find().sort({ createdAt: -1 }).limit(500))
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/sales — admin create (a new sale is never auto-activated; use toggle)
const createSale = async (req, res) => {
  try {
    const { data, error } = buildSaleData(req.body || {}, { partial: false })
    if (error) return res.status(400).json({ message: error })
    delete data.isActive
    const sale = await Sale.create(data)
    res.status(201).json(sale)
  } catch (e) {
    if (e.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(e.errors).map(x => x.message).join(', ') })
    }
    res.status(500).json({ message: 'Server error' })
  }
}

// PUT /api/sales/:id — admin update
const updateSale = async (req, res) => {
  try {
    const { data, error } = buildSaleData(req.body || {}, { partial: true })
    if (error) return res.status(400).json({ message: error })
    // If activating this sale, deactivate all others first
    if (data.isActive === true) {
      await Sale.updateMany({ _id: { $ne: req.params.id } }, { isActive: false })
    }
    const sale = await Sale.findByIdAndUpdate(req.params.id, { $set: data }, { new: true, runValidators: true })
    if (!sale) return res.status(404).json({ message: 'Sale not found' })
    res.json(sale)
  } catch (e) {
    if (e.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(e.errors).map(x => x.message).join(', ') })
    }
    res.status(500).json({ message: 'Server error' })
  }
}

// DELETE /api/sales/:id — admin delete
const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id)
    if (!sale) return res.status(404).json({ message: 'Sale not found' })
    res.json({ message: 'Sale deleted' })
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
}

// PUT /api/sales/:id/toggle — admin toggle active
const toggleSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
    if (!sale) return res.status(404).json({ message: 'Sale not found' })
    if (!sale.isActive) {
      await Sale.updateMany({}, { isActive: false })
    }
    sale.isActive = !sale.isActive
    await sale.save()
    res.json(sale)
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getActiveSale, getAllSales, createSale, updateSale, deleteSale, toggleSale }
