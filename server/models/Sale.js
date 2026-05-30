const mongoose = require('mongoose')

const saleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Sale name is required'],
      trim: true,
      // e.g. "Eid Sale", "Summer Special"
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
      // percentage = e.g. 20% off
      // fixed = e.g. PKR 500 off
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
      // If percentage: 0–100. If fixed: PKR amount.
    },
    // Apply to specific products or ALL
    appliesTo: {
      type: String,
      enum: ['all', 'selected'],
      default: 'all',
    },
    products: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
    ],
    isActive: {
      type: Boolean,
      default: false,
    },
    startsAt: { type: Date },
    endsAt:   { type: Date },
  },
  { timestamps: true }
)

// Helper: calculate discounted price
saleSchema.methods.applyTo = function (originalPrice) {
  if (!this.isActive) return originalPrice
  if (this.discountType === 'percentage') {
    return Math.round(originalPrice * (1 - this.discountValue / 100))
  }
  return Math.max(0, originalPrice - this.discountValue)
}

module.exports = mongoose.model('Sale', saleSchema)