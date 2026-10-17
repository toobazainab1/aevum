const Order   = require('../models/Order')
const Product = require('../models/Product')
const { sendOrderEmail } = require('../emailService')
const storage = require('../utils/fileStorage')
const { sanitizeDeep } = require('../middleware/sanitize')
const { cleanText, isObjectId, queryString } = require('../utils/validate')

const EMAIL_TRIGGER_STATUSES = ['confirmed', 'shipped', 'delivered', 'cancelled']
const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
const PAYMENT_METHODS = ['easypaisa'] // only EasyPaisa is accepted for new orders
const PROVINCES = [
  'Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan',
  'Islamabad Capital Territory', 'Azad Jammu & Kashmir', 'Gilgit-Baltistan',
]
const MAX_ITEMS = 20
const MAX_QTY = 10


// ─── POST /api/orders ─────────────────────────────────────────
const placeOrder = async (req, res) => {
  const fail = (code, message) => res.status(code).json({ message })

  try {
    const body = req.body || {}

    // items / shippingAddress arrive as JSON strings (multipart form)
    let rawItems, rawShipping
    try {
      rawItems    = typeof body.items === 'string' ? JSON.parse(body.items) : body.items
      rawShipping = typeof body.shippingAddress === 'string' ? JSON.parse(body.shippingAddress) : body.shippingAddress
    } catch {
      return fail(400, 'Invalid order data')
    }
    sanitizeDeep(rawItems); sanitizeDeep(rawShipping)

    if (!Array.isArray(rawItems) || rawItems.length === 0) return fail(400, 'No items in order')
    if (rawItems.length > MAX_ITEMS) return fail(400, `You can order at most ${MAX_ITEMS} different items at once`)
    if (!rawShipping || typeof rawShipping !== 'object' || Array.isArray(rawShipping)) {
      return fail(400, 'Shipping address is required')
    }

    // ── Shipping address (whitelisted fields only) ──
    const phone = cleanText(rawShipping.phone, 20).replace(/[\s-]/g, '')
    const shipping = {
      fullName:   cleanText(rawShipping.fullName, 80),
      phone,
      address:    cleanText(rawShipping.address, 200),
      city:       cleanText(rawShipping.city, 60),
      province:   cleanText(rawShipping.province, 40),
      postalCode: cleanText(rawShipping.postalCode, 10),
    }
    if (shipping.fullName.length < 2) return fail(400, 'Please enter your full name')
    if (!/^\+?[0-9]{10,13}$/.test(shipping.phone)) return fail(400, 'Please enter a valid phone number (10-11 digits)')
    if (shipping.address.length < 5) return fail(400, 'Please enter your street address')
    if (shipping.city.length < 2) return fail(400, 'Please enter your city')
    if (!PROVINCES.includes(shipping.province)) return fail(400, 'Please choose a valid province')
    if (shipping.postalCode && !/^[A-Za-z0-9 -]{3,10}$/.test(shipping.postalCode)) return fail(400, 'Invalid postal code')

    // ── Payment ──
    const paymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod : 'easypaisa'
    if (!PAYMENT_METHODS.includes(paymentMethod)) return fail(400, 'Invalid payment method')
    if (!req.file) return fail(400, 'Please upload your EasyPaisa payment screenshot')

    const notes = cleanText(body.notes, 500)

    // ── Items: only product id, quantity and size are read from the client ──
    const wanted = []
    for (const item of rawItems) {
      if (!item || typeof item !== 'object') return fail(400, 'Invalid item in order')
      const id = String(item.product || item._id || '')
      if (!isObjectId(id)) return fail(400, 'Invalid product in order')
      const quantity = Number(item.quantity)
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) {
        return fail(400, `Quantity must be between 1 and ${MAX_QTY}`)
      }
      wanted.push({ id, quantity, size: cleanText(item.size, 20) })
    }

    const products = await Product.find({ _id: { $in: [...new Set(wanted.map(w => w.id))] }, isActive: true })
    const byId = new Map(products.map(p => [p._id.toString(), p]))

    let subtotal = 0
    const orderItems = []
    for (const w of wanted) {
      const product = byId.get(w.id)
      if (!product) return fail(400, 'One of the products in your cart is no longer available')

      const size = w.size || product.sizes[0]
      if (!product.sizes.includes(size)) return fail(400, `Size "${size}" is not available for ${product.name}`)

      // price always comes from the database, never from the client
      subtotal += product.price * w.quantity
      orderItems.push({
        product:     product._id,
        name:        product.name,
        price:       product.price,
        quantity:    w.quantity,
        size,
        bottleColor: product.bottleColor,
      })
    }

    const shippingCharge = subtotal > 5000 ? 0 : 200
    const total = subtotal + shippingCharge

    // Only now (everything validated) is the screenshot stored
    let screenshotRef = ''
    if (req.file) screenshotRef = await storage.saveImage(req.file.buffer, req.file.mimetype)

    let order
    try {
      order = await Order.create({
        user:              req.user._id,
        items:             orderItems,
        shippingAddress:   shipping,
        subtotal,
        shippingCharge,
        total,
        paymentMethod,
        notes,
        paymentScreenshot: screenshotRef,
      })
    } catch (err) {
      if (screenshotRef) storage.deleteImage(screenshotRef) // don't leave an orphaned file
      throw err
    }

    res.status(201).json(order)
  } catch (error) {
    console.error('Place order error:', error.message)
    if (error.name === 'ValidationError')
      return res.status(400).json({ message: Object.values(error.errors).map(e => e.message).join(', ') })
    res.status(500).json({ message: 'Server error while placing order' })
  }
}

// ─── GET /api/orders/my ───────────────────────────────────────
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name bottleColor')
    res.json(orders)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// ─── GET /api/orders/:id ──────────────────────────────────────
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name bottleColor')

    if (!order) return res.status(404).json({ message: 'Order not found' })
    const ownerId = order.user && order.user._id ? order.user._id.toString() : ''
    if (req.user.role !== 'admin' && ownerId !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorised' })

    res.json(order)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// ─── GET /api/orders/:id/screenshot (owner or admin) ──────────
// Payment screenshots are private: they are no longer served as public static files.
const getPaymentScreenshot = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).select('user paymentScreenshot')
    if (!order || !order.paymentScreenshot) return res.status(404).json({ message: 'Not found' })

    const ownerId = order.user ? order.user.toString() : ''
    if (req.user.role !== 'admin' && ownerId !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorised' })

    const img = await storage.getImage(order.paymentScreenshot)
    if (!img) return res.status(404).json({ message: 'Not found' })

    res.set({
      'Content-Type': img.mime,
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    })
    res.send(img.buffer)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// ─── GET /api/orders (admin) ──────────────────────────────────
const getAllOrders = async (req, res) => {
  try {
    const query = {}
    const status = queryString(req.query.status)
    if (status) {
      if (!VALID_STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid status' })
      query.status = status
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(2000)
      .populate('user', 'name email')

    // Only delivered orders count as revenue
    const totalRevenue = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.total, 0)

    res.json({ orders, totalRevenue, count: orders.length })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// ─── PUT /api/orders/:id/status (admin) ───────────────────────
const updateOrderStatus = async (req, res) => {
  try {
    const { status, notes } = req.body || {}

    if (typeof status !== 'string' || !VALID_STATUSES.includes(status))
      return res.status(400).json({ message: 'Invalid status' })

    const updateFields = {
      status,
      ...(status === 'delivered' ? { isPaid: true, paidAt: new Date() } : {}),
      ...(notes !== undefined ? { notes: cleanText(notes, 1000) } : {}),
    }

    const order = await Order.findByIdAndUpdate(req.params.id, { $set: updateFields }, { new: true })
      .populate('user', 'name email')

    if (!order) return res.status(404).json({ message: 'Order not found' })

    // Auto-send email on key status changes
    if (EMAIL_TRIGGER_STATUSES.includes(status) && order.user?.email) {
      await sendOrderEmail({
        to:              order.user.email,
        customerName:    order.user.name,
        orderId:         order._id.toString(),
        status,
        items:           order.items,
        total:           order.total,
        shippingAddress: order.shippingAddress,
      })
    }

    res.json(order)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// ─── PUT /api/orders/:id/confirm-payment (admin) ──────────────
const confirmPayment = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: { paymentConfirmed: true, paymentConfirmedAt: new Date() } },
      { new: true }
    ).populate('user', 'name email')

    if (!order) return res.status(404).json({ message: 'Order not found' })
    res.json(order)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// ─── GET /api/orders/admin/stats (admin) ──────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const [totalOrders, pendingOrders, deliveredOrders, cancelledOrders, deliveredOnly] =
      await Promise.all([
        Order.countDocuments(),
        Order.countDocuments({ status: 'pending' }),
        Order.countDocuments({ status: 'delivered' }),
        Order.countDocuments({ status: 'cancelled' }),
        Order.find({ status: 'delivered' }).select('total createdAt'),
      ])

    const totalRevenue  = deliveredOnly.reduce((sum, o) => sum + o.total, 0)
    const sevenDaysAgo  = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentRevenue = deliveredOnly.filter(o => o.createdAt >= sevenDaysAgo).reduce((sum, o) => sum + o.total, 0)

    // Pending payment confirmations
    const pendingPaymentConfirmation = await Order.countDocuments({
      paymentMethod:    { $in: ['easypaisa', 'jazzcash'] },
      paymentConfirmed: false,
      status:           { $ne: 'cancelled' },
    })

    res.json({ totalOrders, pendingOrders, deliveredOrders, cancelledOrders, totalRevenue, recentRevenue, pendingPaymentConfirmation })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { placeOrder, getMyOrders, getOrderById, getPaymentScreenshot, getAllOrders, updateOrderStatus, confirmPayment, getDashboardStats }