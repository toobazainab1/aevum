const express = require('express')
const router = express.Router()
const { getActiveSale, getAllSales, createSale, updateSale, deleteSale, toggleSale } = require('../controllers/saleController')
const { protect, adminOnly } = require('../middleware/authMiddleware')

// Public
router.get('/', getActiveSale)

// Admin
router.get('/all',         protect, adminOnly, getAllSales)
router.post('/',           protect, adminOnly, createSale)
router.put('/:id',         protect, adminOnly, updateSale)
router.put('/:id/toggle',  protect, adminOnly, toggleSale)
router.delete('/:id',      protect, adminOnly, deleteSale)

module.exports = router