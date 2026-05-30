const mongoose = require('mongoose')

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    tagline: {
      type: String,
      required: [true, 'Tagline is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      // e.g. 'Woody Oud', 'Fresh Aromatic', 'Floral Oriental', 'Amber Floral'
    },
    gender: {
      type: String,
      enum: ['For Him', 'For Her', 'Unisex'],
      required: true,
    },
    filterKey: {
      type: String,
      enum: ['him', 'her', 'unisex'],
      required: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    sizes: {
      type: [String], // e.g. ['50ml', '100ml']
      required: true,
    },
    badge: {
      type: String,
      enum: ['bestseller', 'new', 'limited', ''],
      default: '',
    },

    // Scent notes
    notes: [String],       // Quick display notes e.g. ['Oud', 'Pepper']
    topNotes: [String],
    heartNotes: [String],
    baseNotes: [String],

    // Visual / styling (used by frontend SVG rendering)
    bg: {
      type: String,
      default: 'linear-gradient(160deg, #1C1712, #2E2418, #1C1712)',
    },
    bottleColor: {
      type: String,
      default: '#3d5c30',
    },
    accent: {
      type: String,
      default: '#C9A96E',
    },

    // Optional image upload path
    image: {
      type: String,
      default: '',
    },

    stock: {
      type: Number,
      default: 100,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Product', productSchema)