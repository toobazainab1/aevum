const express = require('express')
const router  = express.Router()
const multer  = require('multer')
const path    = require('path')
const fs      = require('fs')
const crypto  = require('crypto')
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
// Files live OUTSIDE any publicly served folder and are only readable through
// GET /api/orders/:id/screenshot (owner or admin).
const uploadDir = path.resolve(__dirname, '../uploads/payments')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true, mode: 0o700 })

const EXT_BY_MIME = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  // random, unguessable name; extension comes from the allowed MIME type, never from the client filename
  filename: (req, file, cb) => cb(null, `payment-${crypto.randomBytes(16).toString('hex')}${EXT_BY_MIME[file.mimetype]}`),
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 20, fieldSize: 64 * 1024, parts: 30 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (EXT_BY_MIME[file.mimetype]) return cb(null, true)
    const err = new Error('Only JPG, PNG or WebP images are allowed')
    err.status = 400; err.expose = true
    cb(err)
  },
})

// Confirms the saved file really is the image type it claims to be (magic bytes)
const verifyUpload = async (req, res, next) => {
  if (!req.file) return next()
  try {
    const fh = await fs.promises.open(req.file.path, 'r')
    const buf = Buffer.alloc(12)
    await fh.read(buf, 0, 12, 0)
    await fh.close()
    const type = detectImageType(buf)
    if (!type || type.mime !== req.file.mimetype) {
      await fs.promises.unlink(req.file.path).catch(() => {})
      return res.status(400).json({ message: 'The uploaded file is not a valid image' })
    }
    next()
  } catch (err) { next(err) }
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
