const Product = require('../models/Product')
const { cleanText, isObjectId, queryString } = require('../utils/validate')

const GENDERS = ['For Him', 'For Her', 'Unisex']
const FILTER_KEYS = ['him', 'her', 'unisex']
const BADGES = ['bestseller', 'new', 'limited', '']
const HEX = /^#[0-9a-fA-F]{3,8}$/
// bg is used as a CSS background: only allow gradient/colour characters (no url(), no quotes, no ;)
const SAFE_CSS_BG = /^[a-zA-Z0-9#%(),.\s-]{1,300}$/

const toList = (v, maxItems, maxLen) =>
  (Array.isArray(v) ? v : []).slice(0, maxItems).map(x => cleanText(x, maxLen)).filter(Boolean)

// Whitelists + validates product input. Returns { data } or { error }.
function buildProductData(body, { partial }) {
  const data = {}
  const has = (k) => Object.prototype.hasOwnProperty.call(body, k)
  const need = (k) => !partial || has(k)

  if (need('name'))        data.name        = cleanText(body.name, 80)
  if (need('tagline'))     data.tagline     = cleanText(body.tagline, 160)
  if (need('description')) data.description = cleanText(body.description, 2000)
  if (need('category'))    data.category    = cleanText(body.category, 60)

  if (need('gender')) {
    if (!GENDERS.includes(body.gender)) return { error: 'Invalid gender' }
    data.gender = body.gender
  }
  if (need('filterKey')) {
    if (!FILTER_KEYS.includes(body.filterKey)) return { error: 'Invalid filter key' }
    data.filterKey = body.filterKey
  }
  if (need('price')) {
    const price = Number(body.price)
    if (!Number.isFinite(price) || price < 0 || price > 10000000) return { error: 'Invalid price' }
    data.price = price
  }
  if (need('sizes')) {
    data.sizes = toList(body.sizes, 8, 20)
    if (data.sizes.length === 0) return { error: 'At least one size is required' }
  }
  if (has('badge')) {
    if (!BADGES.includes(body.badge)) return { error: 'Invalid badge' }
    data.badge = body.badge
  }
  for (const k of ['notes', 'topNotes', 'heartNotes', 'baseNotes']) {
    if (has(k)) data[k] = toList(body[k], 12, 40)
  }
  if (has('bg')) {
    if (typeof body.bg !== 'string' || !SAFE_CSS_BG.test(body.bg)) return { error: 'Invalid background value' }
    data.bg = body.bg
  }
  for (const k of ['bottleColor', 'accent']) {
    if (has(k)) {
      if (typeof body[k] !== 'string' || !HEX.test(body[k])) return { error: `Invalid ${k} (use a hex colour like #3d5c30)` }
      data[k] = body[k]
    }
  }
  if (has('image')) {
    const img = typeof body.image === 'string' ? body.image.trim() : ''
    if (img && !/^(https:\/\/|\/)[^\s"'<>]{1,300}$/.test(img)) return { error: 'Invalid image URL' }
    data.image = img
  }
  if (has('stock')) {
    const stock = Number(body.stock)
    if (!Number.isInteger(stock) || stock < 0 || stock > 100000) return { error: 'Invalid stock' }
    data.stock = stock
  }
  if (has('isActive')) data.isActive = body.isActive === true

  return { data }
}

// ─── GET /api/products ────────────────────────────────────────
// Public - supports ?filter=him|her|unisex&category=...
const getProducts = async (req, res) => {
  try {
    const query = { isActive: true }

    const filter = queryString(req.query.filter)
    if (filter && filter !== 'all') {
      if (!FILTER_KEYS.includes(filter)) return res.json([])
      query.filterKey = filter
    }
    const category = queryString(req.query.category)
    if (category) query.category = category

    const products = await Product.find(query).sort({ createdAt: -1 }).limit(200)
    res.json(products)
  } catch (error) {
    console.error('Get products error:', error.message)
    res.status(500).json({ message: 'Server error' })
  }
}

// ─── GET /api/products/:id ────────────────────────────────────
const getProductById = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(404).json({ message: 'Product not found' })
    const product = await Product.findById(req.params.id)
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found' })
    }
    res.json(product)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// ─── POST /api/products  (admin) ─────────────────────────────
const createProduct = async (req, res) => {
  try {
    const { data, error } = buildProductData(req.body || {}, { partial: false })
    if (error) return res.status(400).json({ message: error })
    const product = await Product.create(data)
    res.status(201).json(product)
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors).map(e => e.message).join(', ') })
    }
    res.status(500).json({ message: 'Server error' })
  }
}

// ─── PUT /api/products/:id  (admin) ──────────────────────────
const updateProduct = async (req, res) => {
  try {
    const { data, error } = buildProductData(req.body || {}, { partial: true })
    if (error) return res.status(400).json({ message: error })
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: data },
      { new: true, runValidators: true }
    )
    if (!product) return res.status(404).json({ message: 'Product not found' })
    res.json(product)
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors).map(e => e.message).join(', ') })
    }
    res.status(500).json({ message: 'Server error' })
  }
}

// ─── DELETE /api/products/:id  (admin) ───────────────────────
// Soft delete — sets isActive: false (preserves order history)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true })
    if (!product) return res.status(404).json({ message: 'Product not found' })
    res.json({ message: 'Product removed successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// ─── GET /api/products/admin/all  (admin) ────────────────────
const getAllProductsAdmin = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).limit(1000)
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
