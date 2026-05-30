const express = require('express')
const router = express.Router()
const {
  placeOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getDashboardStats,
} = require('../controllers/orderController')
const { protect, adminOnly } = require('../middleware/authMiddleware')

// All order routes require login
router.use(protect)

// User routes
router.post('/',       placeOrder)
router.get('/my',      getMyOrders)
router.get('/:id',     getOrderById)

// Admin routes
router.get('/',                  adminOnly, getAllOrders)
router.get('/admin/stats',       adminOnly, getDashboardStats)
router.put('/:id/status',        adminOnly, updateOrderStatus)

module.exports = router