const Sale = require('../models/Sale')
const Product = require('../models/Product')

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
    const sales = await Sale.find().sort({ createdAt: -1 })
    res.json(sales)
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /api/sales — admin create
const createSale = async (req, res) => {
  try {
    const sale = await Sale.create(req.body)
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
    // If activating this sale, deactivate all others first
    if (req.body.isActive === true) {
      await Sale.updateMany({ _id: { $ne: req.params.id } }, { isActive: false })
    }
    const sale = await Sale.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!sale) return res.status(404).json({ message: 'Sale not found' })
    res.json(sale)
  } catch (e) {
    res.status(500).json({ message: 'Server error' })
  }
}

// DELETE /api/sales/:id — admin delete
const deleteSale = async (req, res) => {
  try {
    await Sale.findByIdAndDelete(req.params.id)
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
      // Deactivate all others before activating
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