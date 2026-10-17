const mongoose = require('mongoose')
const config = require('./env')

mongoose.set('strictQuery', true)

// The connection is cached on `global` so serverless functions (Vercel) reuse it between
// requests instead of opening a new one every time.
const cache = global.__aevumMongo || (global.__aevumMongo = { promise: null })

async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection
  if (!cache.promise) {
    cache.promise = mongoose
      .connect(config.mongoUri, { serverSelectionTimeoutMS: 10000, maxPoolSize: 5, bufferCommands: false })
      .then(() => mongoose.connection)
      .catch(err => { cache.promise = null; throw err })
  }
  return cache.promise
}

// Express middleware: make sure the database is connected before handling a request
const ensureDb = async (req, res, next) => {
  try {
    await connectDB()
    next()
  } catch (err) {
    console.error('MongoDB connection failed:', err.message)
    res.status(503).json({ message: 'Service temporarily unavailable. Please try again.' })
  }
}

module.exports = { connectDB, ensureDb }
