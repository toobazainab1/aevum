const express = require('express')
const router  = express.Router()
const multer  = require('multer')
const {
  placeOrder, getMyOrders, getOrderById, getPaymentScreenshot,
  getAllOrders, updateOrderStatus, getDashboardStats, confirmPayment,
} = require('../controllers/orderController')
const { protect, adminOnly, validateId } = require('../middleware/authMiddleware')
const { sanitizeRequest } = require('../middleware/sanitize')
const { orderLimiter, adminLimiter } = require('../middleware/rateLimit')
const { detectImageType } = require('../utils/fileType')

router.param('id', validateId)

// ── Screenshot upload config ──────────────────────────────────
// The image is held in memory, validated, and only then saved (Cloudinary private storage,
// or local disk in development) by utils/fileStorage.js. It is never publicly reachable:
// it can only be read through GET /api/orders/:id/screenshot (owner or admin).
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']

const upload = multer({
  storage: multer.memoryStorage(),
<<<<<<< HEAD
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 20, fieldSize: 64 * 1024, parts: 30 }, // 5MB max
=======
  limits: { fileSize: 4 * 1024 * 1024, files: 1, fields: 20, fieldSize: 64 * 1024, parts: 30 }, // 4MB max (Vercel limits requests to ~4.5MB)
>>>>>>> 1fc1e36 (Vercel serverless backend)
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true)
    const err = new Error('Only JPG, PNG or WebP images are allowed')
    err.status = 400; err.expose = true
    cb(err)
  },
})

// Confirms the upload really is the image type it claims to be (magic bytes)
const verifyUpload = (req, res, next) => {
  if (!req.file) return next()
  const type = detectImageType(req.file.buffer.subarray(0, 12))
  if (!type || type.mime !== req.file.mimetype) {
    return res.status(400).json({ message: 'The uploaded file is not a valid image' })
  }
  next()
}

// All order routes require login
router.use(protect)

// User routes
router.post('/', orderLimiter, upload.single('paymentScreenshot'), verifyUpload, sanitizeRequest, placeOrder)
router.get('/my',  getMyOrders)
router.get('/:id/screenshot', getPaymentScreenshot)
router.get('/:id', getOrderById)

// Admin routes
router.get('/',                adminLimiter, adminOnly, getAllOrders)
router.get('/admin/stats',     adminLimiter, adminOnly, getDashboardStats)
router.put('/:id/status',      adminLimiter, adminOnly, updateOrderStatus)
router.put('/:id/confirm-payment', adminLimiter, adminOnly, confirmPayment)

module.exports = router
