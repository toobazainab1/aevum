const Order   = require('../models/Order')
const Product = require('../models/Product')
const { sendOrderEmail } = require('../emailService')

const EMAIL_TRIGGER_STATUSES = ['confirmed', 'shipped', 'delivered', 'cancelled']

// ─── POST /api/orders ─────────────────────────────────────────
const placeOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod = 'cod', notes = '' } = req.body

    // Parse items if sent as JSON string (multipart form)
    let parsedItems = items
    if (typeof items === 'string') parsedItems = JSON.parse(items)

    let parsedShipping = shippingAddress
    if (typeof shippingAddress === 'string') parsedShipping = JSON.parse(shippingAddress)

    if (!parsedItems || parsedItems.length === 0)
      return res.status(400).json({ message: 'No items in order' })
    if (!parsedShipping)
      return res.status(400).json({ message: 'Shipping address is required' })

    // For easypaisa/jazzcash, screenshot is required
    if ((paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash') && !req.file) {
      return res.status(400).json({ message: 'Payment screenshot is required for this payment method' })
    }

    let subtotal = 0
    const orderItems = []

    for (const item of parsedItems) {
      const product = await Product.findById(item.product || item._id)
      if (!product || !product.isActive)
        return res.status(400).json({ message: `Product "${item.name}" is no longer available` })

      subtotal += product.price * item.quantity
      orderItems.push({
        product:     product._id,
        name:        product.name,
        price:       product.price,
        quantity:    item.quantity,
        size:        item.size || product.sizes[0],
        bottleColor: product.bottleColor,
      })
    }

    const shippingCharge = subtotal > 5000 ? 0 : 200
    const total = subtotal + shippingCharge

    const order = await Order.create({
      user:              req.user._id,
      items:             orderItems,
      shippingAddress:   parsedShipping,
      subtotal,
      shippingCharge,
      total,
      paymentMethod,
      notes,
      paymentScreenshot: req.file ? `/uploads/payments/${req.file.filename}` : '',
    })

    res.status(201).json(order)
  } catch (error) {
    console.error('Place order error:', error)
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
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorised' })

    res.json(order)
  } catch (error) {
    if (error.name === 'CastError') return res.status(404).json({ message: 'Order not found' })
    res.status(500).json({ message: 'Server error' })
  }
}

// ─── GET /api/orders (admin) ──────────────────────────────────
const getAllOrders = async (req, res) => {
  try {
    const query = {}
    if (req.query.status) query.status = req.query.status

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
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
    const { status, notes } = req.body

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(status))
      return res.status(400).json({ message: 'Invalid status' })

    const updateFields = {
      status,
      ...(status === 'delivered' ? { isPaid: true, paidAt: new Date() } : {}),
      ...(notes !== undefined ? { notes } : {}),
    }

    const order = await Order.findByIdAndUpdate(req.params.id, updateFields, { new: true })
      .populate('user', 'name email')

    if (!order) return res.status(404).json({ message: 'Order not found' })

    // Auto-send email on key status changes
    if (EMAIL_TRIGGER_STATUSES.includes(status) && order.user?.email) {
      sendOrderEmail({
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
      { paymentConfirmed: true, paymentConfirmedAt: new Date() },
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

module.exports = { placeOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus, confirmPayment, getDashboardStats }