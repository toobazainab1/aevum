const mongoose = require('mongoose')

const orderItemSchema = new mongoose.Schema({
  product:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:        { type: String, required: true },
  price:       { type: Number, required: true },
  quantity:    { type: Number, required: true, min: 1 },
  size:        { type: String, required: true },
  bottleColor: { type: String },
})

const shippingAddressSchema = new mongoose.Schema({
  fullName:   { type: String, required: true },
  phone:      { type: String, required: true },
  address:    { type: String, required: true },
  city:       { type: String, required: true },
  province:   { type: String, required: true },
  postalCode: { type: String },
})

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    shippingAddress: shippingAddressSchema,

    subtotal:       { type: Number, required: true },
    shippingCharge: { type: Number, default: 0 },
    total:          { type: Number, required: true },

    paymentMethod: {
      type: String,
      enum: ['cod', 'easypaisa', 'jazzcash'],
      default: 'cod',
    },

    // Screenshot upload path (for easypaisa/jazzcash)
    paymentScreenshot:  { type: String, default: '' },
    paymentConfirmed:   { type: Boolean, default: false },
    paymentConfirmedAt: { type: Date },

    isPaid:  { type: Boolean, default: false },
    paidAt:  { type: Date },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Order', orderSchema)