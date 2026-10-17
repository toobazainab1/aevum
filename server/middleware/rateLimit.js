<<<<<<< HEAD
// Small in-memory rate limiter (per server instance). Fine for a single-instance deployment.
// If you scale to several instances, move to a shared store (e.g. Redis).
const MAX_KEYS = 100000

function rateLimit({ windowMs, max, message = 'Too many requests, please try again later.', keyGenerator }) {
=======
// Rate limiting.
//  • persistent: true  -> counters live in MongoDB (collection "ratelimits"), so they are shared by every
//    server instance. Required on serverless hosts (Vercel) where each request may hit a new instance.
//    If MongoDB is unreachable it falls back to the in-memory counter instead of blocking everyone.
//  • otherwise         -> in-memory counter (per instance), cheap, used for broad limits.
const mongoose = require('mongoose')

const MAX_KEYS = 100000
let indexReady = false

function rateLimit({ name = 'rl', windowMs, max, message = 'Too many requests, please try again later.', keyGenerator, persistent = false }) {
>>>>>>> 1fc1e36 (Vercel serverless backend)
  const hits = new Map()

  const sweep = () => {
    const now = Date.now()
    for (const [k, v] of hits) if (v.reset <= now) hits.delete(k)
  }
  setInterval(sweep, Math.min(windowMs, 60000)).unref()

<<<<<<< HEAD
  return (req, res, next) => {
    const key = keyGenerator ? keyGenerator(req) : req.ip
    const now = Date.now()
=======
  const memoryCount = (key, now) => {
>>>>>>> 1fc1e36 (Vercel serverless backend)
    let entry = hits.get(key)
    if (!entry || entry.reset <= now) {
      if (hits.size >= MAX_KEYS) sweep()
      entry = { count: 0, reset: now + windowMs }
      hits.set(key, entry)
    }
    entry.count += 1
<<<<<<< HEAD
    const retry = Math.max(1, Math.ceil((entry.reset - now) / 1000))
    res.setHeader('RateLimit-Limit', String(max))
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - entry.count)))
    res.setHeader('RateLimit-Reset', String(retry))
    if (entry.count > max) {
=======
    return { count: entry.count, reset: entry.reset }
  }

  // fixed window: one document per (limiter, key, window number); MongoDB deletes it after expireAt
  const dbCount = async (key, now) => {
    const col = mongoose.connection.collection('ratelimits')
    if (!indexReady) {
      indexReady = true
      col.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 }).catch(() => { indexReady = false })
    }
    const windowNo = Math.floor(now / windowMs)
    const reset = (windowNo + 1) * windowMs
    const res = await col.findOneAndUpdate(
      { _id: `${name}:${key}:${windowNo}` },
      { $inc: { count: 1 }, $setOnInsert: { expireAt: new Date(reset + 60000) } },
      { upsert: true, returnDocument: 'after' }
    )
    const doc = res && Object.prototype.hasOwnProperty.call(res, 'value') ? res.value : res // driver v5 vs v6 result shape
    if (!doc || typeof doc.count !== 'number') throw new Error('unexpected rate limit result')
    return { count: doc.count, reset }
  }

  return async (req, res, next) => {
    const key = String(keyGenerator ? keyGenerator(req) : req.ip)
    const now = Date.now()
    let result
    if (persistent && mongoose.connection.readyState === 1) {
      try { result = await dbCount(key, now) }
      catch (err) { console.error('Rate limit store error, using memory:', err.message) }
    }
    if (!result) result = memoryCount(key, now)

    const retry = Math.max(1, Math.ceil((result.reset - now) / 1000))
    res.setHeader('RateLimit-Limit', String(max))
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - result.count)))
    res.setHeader('RateLimit-Reset', String(retry))
    if (result.count > max) {
>>>>>>> 1fc1e36 (Vercel serverless backend)
      res.setHeader('Retry-After', String(retry))
      return res.status(429).json({ message })
    }
    next()
  }
}

const emailKey = (req) =>
  `${req.ip}|${String((req.body && req.body.email) || '').toLowerCase().slice(0, 100)}`

module.exports = {
  rateLimit,
<<<<<<< HEAD
  globalLimiter:   rateLimit({ windowMs: 15 * 60 * 1000, max: 600 }),
  loginLimiter:    rateLimit({ windowMs: 15 * 60 * 1000, max: 10, keyGenerator: emailKey, message: 'Too many login attempts. Please try again in 15 minutes.' }),
  loginIpLimiter:  rateLimit({ windowMs: 15 * 60 * 1000, max: 40, message: 'Too many login attempts. Please try again in 15 minutes.' }),
  registerLimiter: rateLimit({ windowMs: 60 * 60 * 1000, max: 8, message: 'Too many sign-ups from this network. Please try again later.' }),
  orderLimiter:    rateLimit({ windowMs: 60 * 60 * 1000, max: 15, message: 'Too many orders placed. Please try again later.' }),
  adminLimiter:    rateLimit({ windowMs: 60 * 1000, max: 120 }),
=======
  globalLimiter:   rateLimit({ name: 'global', windowMs: 15 * 60 * 1000, max: 600 }),
  loginLimiter:    rateLimit({ name: 'login', persistent: true, windowMs: 15 * 60 * 1000, max: 10, keyGenerator: emailKey, message: 'Too many login attempts. Please try again in 15 minutes.' }),
  loginIpLimiter:  rateLimit({ name: 'loginip', persistent: true, windowMs: 15 * 60 * 1000, max: 40, message: 'Too many login attempts. Please try again in 15 minutes.' }),
  registerLimiter: rateLimit({ name: 'register', persistent: true, windowMs: 60 * 60 * 1000, max: 8, message: 'Too many sign-ups from this network. Please try again later.' }),
  orderLimiter:    rateLimit({ name: 'order', persistent: true, windowMs: 60 * 60 * 1000, max: 15, message: 'Too many orders placed. Please try again later.' }),
  adminLimiter:    rateLimit({ name: 'admin', windowMs: 60 * 1000, max: 120 }),
>>>>>>> 1fc1e36 (Vercel serverless backend)
}
