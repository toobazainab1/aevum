const Product = require('../models/Product')

// ─── GET /api/products ────────────────────────────────────────
// Public - supports ?filter=him|her&category=...
const getProducts = async (req, res) => {
  try {
    const query = { isActive: true }

    if (req.query.filter && req.query.filter !== 'all') {
      query.filterKey = req.query.filter
    }
    if (req.query.category) {
      query.category = req.query.category
    }

    const products = await Product.find(query).sort({ createdAt: -1 })
    res.json(products)
  } catch (error) {
    console.error('Get products error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// ─── GET /api/products/:id ────────────────────────────────────
// Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)

    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found' })
    }

    res.json(product)
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Product not found' })
    }
    res.status(500).json({ message: 'Server error' })
  }
}

// ─── POST /api/products  (admin) ─────────────────────────────
const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body)
    res.status(201).json(product)
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message)
      return res.status(400).json({ message: messages.join(', ') })
    }
    res.status(500).json({ message: 'Server error' })
  }
}

// ─── PUT /api/products/:id  (admin) ──────────────────────────
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )

    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    res.json(product)
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message)
      return res.status(400).json({ message: messages.join(', ') })
    }
    res.status(500).json({ message: 'Server error' })
  }
}

// ─── DELETE /api/products/:id  (admin) ───────────────────────
// Soft delete — sets isActive: false (preserves order history)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    )

    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    res.json({ message: 'Product removed successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// ─── GET /api/products/admin/all  (admin) ────────────────────
// Returns ALL products including inactive
const getAllProductsAdmin = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 })
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// ─── POST /api/products/seed  (admin) ────────────────────────
// Seeds the initial 4 AEVUM fragrances from your frontend data
const seedProducts = async (req, res) => {
  try {
    const count = await Product.countDocuments()
    if (count > 0) {
      return res.status(400).json({ message: 'Products already seeded' })
    }

    const products = [
      {
        name: 'Aurum',
        tagline: 'The Gold Standard',
        description: 'Aurum opens with saffron and black pepper before settling into a heart of rare oud and cedarwood. The dry down reveals aged vetiver and amber — the scent of gold in its most timeless form.',
        category: 'Woody Oud',
        gender: 'For Him',
        filterKey: 'him',
        price: 4500,
        sizes: ['50ml', '100ml'],
        badge: 'bestseller',
        notes: ['Oud', 'Black Pepper', 'Vetiver', 'Amber'],
        topNotes: ['Black Pepper', 'Saffron', 'Bergamot'],
        heartNotes: ['Oud', 'Cedarwood', 'Vetiver'],
        baseNotes: ['Amber', 'Musk', 'Sandalwood'],
        bg: 'linear-gradient(160deg, #1a2a1a 0%, #3d5c30 60%, #0d1a0d 100%)',
        bottleColor: '#3d5c30',
        accent: '#9AAD84',
      },
      {
        name: 'Maan',
        tagline: 'Honour in Every Drop',
        description: 'Maan is honour made tangible. Bright bergamot opens into forest moss and Atlas cedar — grounded, clean, and unmistakably masculine. For the man rooted in who he is.',
        category: 'Fresh Aromatic',
        gender: 'For Him',
        filterKey: 'him',
        price: 3800,
        sizes: ['75ml', '100ml'],
        badge: 'new',
        notes: ['Cedarwood', 'Moss', 'Bergamot', 'Musk'],
        topNotes: ['Bergamot', 'Green Leaves', 'Galbanum'],
        heartNotes: ['Cedarwood', 'Moss', 'Vetiver'],
        baseNotes: ['Musk', 'Oakmoss', 'Ambergris'],
        bg: 'linear-gradient(160deg, #1e2d1a 0%, #4a6638 60%, #111d0e 100%)',
        bottleColor: '#4a6638',
        accent: '#9AAD84',
      },
      {
        name: 'Nerine',
        tagline: 'Softness is Power',
        description: 'Nerine is a love letter written in scent. Rose absolute from Grasse meets the warmth of oud and a whisper of saffron — as complex and tender as the woman who wears it.',
        category: 'Floral Oriental',
        gender: 'For Her',
        filterKey: 'her',
        price: 4200,
        sizes: ['50ml', '75ml'],
        badge: 'bestseller',
        notes: ['Rose Absolute', 'Oud', 'Saffron', 'Musk'],
        topNotes: ['Saffron', 'Pink Pepper', 'Bergamot'],
        heartNotes: ['Rose Absolute', 'Oud', 'Jasmine'],
        baseNotes: ['Musk', 'Amber', 'Patchouli'],
        bg: 'linear-gradient(160deg, #2a0d14 0%, #5a1e2e 60%, #1a0a10 100%)',
        bottleColor: '#5a1e2e',
        accent: '#B05068',
      },
      {
        name: 'Gul',
        tagline: 'A Secret Worth Keeping',
        description: 'Gul envelops you like silk — jasmine sambac and amber resin wrapped in soft vanilla and warm sandalwood. The scent of a secret, meant only for those close enough to notice.',
        category: 'Amber Floral',
        gender: 'For Her',
        filterKey: 'her',
        price: 3600,
        sizes: ['50ml', '75ml', '100ml'],
        badge: 'new',
        notes: ['Jasmine', 'Amber', 'Vanilla', 'Sandalwood'],
        topNotes: ['Mandarin', 'Jasmine', 'Ylang Ylang'],
        heartNotes: ['Amber', 'Rose', 'Heliotrope'],
        baseNotes: ['Vanilla', 'Sandalwood', 'White Musk'],
        bg: 'linear-gradient(160deg, #2d0f18 0%, #6b2030 60%, #1a0b12 100%)',
        bottleColor: '#6b2030',
        accent: '#B05068',
      },
    ]

    await Product.insertMany(products)
    res.status(201).json({ message: 'Products seeded successfully', count: products.length })
  } catch (error) {
    res.status(500).json({ message: 'Server error during seeding' })
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin,
  seedProducts,
}