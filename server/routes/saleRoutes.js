const express = require('express')
const router = express.Router()
const { getActiveSale, getAllSales, createSale, updateSale, deleteSale, toggleSale } = require('../controllers/saleController')
const { protect, adminOnly, validateId } = require('../middleware/authMiddleware')
const { adminLimiter } = require('../middleware/rateLimit')

router.param('id', validateId)

// Public
router.get('/', getActiveSale)

// Admin
router.get('/all',         adminLimiter, protect, adminOnly, getAllSales)
router.post('/',           adminLimiter, protect, adminOnly, createSale)
router.put('/:id',         adminLimiter, protect, adminOnly, updateSale)
router.put('/:id/toggle',  adminLimiter, protect, adminOnly, toggleSale)
router.delete('/:id',      adminLimiter, protect, adminOnly, deleteSale)

module.exports = router
