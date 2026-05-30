const express = require('express')
const router = express.Router()
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin,
  seedProducts,
} = require('../controllers/productController')
const { protect, adminOnly } = require('../middleware/authMiddleware')

// Public
router.get('/',     getProducts)
router.get('/:id',  getProductById)

// Admin only
router.get('/admin/all',  protect, adminOnly, getAllProductsAdmin)
router.post('/seed',      protect, adminOnly, seedProducts)
router.post('/',          protect, adminOnly, createProduct)
router.put('/:id',        protect, adminOnly, updateProduct)
router.delete('/:id',     protect, adminOnly, deleteProduct)

module.exports = router