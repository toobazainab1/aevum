<<<<<<< HEAD
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

// Validates env vars first; exits if config is unsafe/missing
const config = require('./config/env')
const securityHeaders = require('./middleware/securityHeaders')
const { sanitizeRequest } = require('./middleware/sanitize')
const { globalLimiter } = require('./middleware/rateLimit')

const app = express()

app.disable('x-powered-by')
app.set('trust proxy', config.trustProxy)

app.use(securityHeaders)

// ── CORS: only the origins listed in CLIENT_ORIGINS may call the API from a browser ──
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)                       // curl / server-to-server / same-origin
    cb(null, config.clientOrigins.includes(origin))          // unknown origins get no CORS headers
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,                                        // auth uses a Bearer token, not cookies
  maxAge: 600,
}))

// ── Body parsing with small size limits ──
app.use(express.json({ limit: '20kb' }))
app.use(express.urlencoded({ extended: false, limit: '20kb' }))
app.use(sanitizeRequest)                                     // strips $operators / dotted keys / __proto__

app.use('/api', globalLimiter)

// NOTE: /uploads is intentionally NOT served statically any more.
// Payment screenshots are private and only available via GET /api/orders/:id/screenshot.

// Routes
app.use('/api/auth', require('./routes/authRoutes'))
app.use('/api/products', require('./routes/productRoutes'))
app.use('/api/orders', require('./routes/orderRoutes'))
app.use('/api/sales', require('./routes/saleRoutes'))

app.get('/', (req, res) => {
  res.json({ message: 'AEVUM API running' })
})

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// ── Central error handler: never leaks stack traces or internal messages ──
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'Request too large' })
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON' })
  if (err.name === 'MulterError') {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5MB or smaller' : 'Invalid upload'
    return res.status(400).json({ message: msg })
  }
  if (err.expose && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ message: err.message })
  }
  console.error('Unhandled error:', config.isProd ? err.message : err.stack)
  res.status(500).json({ message: 'Internal Server Error' })
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason && reason.message ? reason.message : reason)
})

mongoose.set('strictQuery', true)
mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000, maxPoolSize: 10 })
=======
// Entry point for local development and always-on hosts (Render, Railway, VPS...).
// On Vercel the app is loaded through api/index.js instead.
const config = require('./config/env')
const app = require('./app')
const { connectDB } = require('./config/db')

connectDB()
>>>>>>> 1fc1e36 (Vercel serverless backend)
  .then(() => {
    console.log('MongoDB connected')
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port} (${config.isProd ? 'production' : 'development'})`)
    })
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message)
    process.exit(1)
  })
