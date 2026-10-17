const express = require('express')
const router = express.Router()
const {
  getProducts, getProductById, createProduct, updateProduct,
  deleteProduct, getAllProductsAdmin, seedProducts,
} = require('../controllers/productController')
const { protect, adminOnly, validateId } = require('../middleware/authMiddleware')
const { adminLimiter } = require('../middleware/rateLimit')

router.param('id', validateId)

// Public
router.get('/',     getProducts)
router.get('/:id',  getProductById)

// Admin only
router.get('/admin/all',  adminLimiter, protect, adminOnly, getAllProductsAdmin)
router.post('/seed',      adminLimiter, protect, adminOnly, seedProducts)
router.post('/',          adminLimiter, protect, adminOnly, createProduct)
router.put('/:id',        adminLimiter, protect, adminOnly, updateProduct)
router.delete('/:id',     adminLimiter, protect, adminOnly, deleteProduct)

module.exports = router
