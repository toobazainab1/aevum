const express = require('express')
const router  = express.Router()
const multer  = require('multer')
const path    = require('path')
const fs      = require('fs')
const {
  placeOrder, getMyOrders, getOrderById,
  getAllOrders, updateOrderStatus, getDashboardStats,
  confirmPayment,
} = require('../controllers/orderController')
const { protect, adminOnly } = require('../middleware/authMiddleware')

// ── Screenshot upload config ──────────────────────────────────
const uploadDir = path.join(__dirname, '../uploads/payments')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const unique = `payment-${Date.now()}-${Math.round(Math.random() * 1e6)}`
    cb(null, unique + path.extname(file.originalname))
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  },
})

// All order routes require login
router.use(protect)

// User routes
router.post('/',   upload.single('paymentScreenshot'), placeOrder)
router.get('/my',  getMyOrders)
router.get('/:id', getOrderById)

// Admin routes
router.get('/',                adminOnly, getAllOrders)
router.get('/admin/stats',     adminOnly, getDashboardStats)
router.put('/:id/status',      adminOnly, updateOrderStatus)
router.put('/:id/confirm-payment', adminOnly, confirmPayment)

module.exports = router