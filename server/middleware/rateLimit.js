const mongoose = require('mongoose')

const MAX_KEYS = 100000
let indexReady = false
let indexPromise = null

function rateLimit({
  name = 'rl',
  windowMs,
  max,
  message = 'Too many requests, please try again later.',
  keyGenerator,
  persistent = false
}) {
  const hits = new Map()

  const sweep = () => {
    const now = Date.now()
    for (const [key, value] of hits) {
      if (value.reset <= now) hits.delete(key)
    }
  }

  const timer = setInterval(sweep, Math.min(windowMs, 60000))
  timer.unref?.()

  const memoryCount = (key, now) => {
    let entry = hits.get(key)

    if (!entry || entry.reset <= now) {
      if (hits.size >= MAX_KEYS) sweep()
      entry = { count: 0, reset: now + windowMs }
      hits.set(key, entry)
    }

    entry.count += 1
    return { count: entry.count, reset: entry.reset }
  }

  const dbCount = async (key, now) => {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB is not connected')
    }

    const col = mongoose.connection.collection('ratelimits')

    if (!indexReady) {
      if (!indexPromise) {
        indexPromise = col
          .createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 })
          .then(() => {
            indexReady = true
          })
          .finally(() => {
            indexPromise = null
          })
      }

      await indexPromise
    }

    const windowNo = Math.floor(now / windowMs)
    const reset = (windowNo + 1) * windowMs

    const result = await col.findOneAndUpdate(
      { _id: `${name}:${key}:${windowNo}` },
      {
        $inc: { count: 1 },
        $setOnInsert: { expireAt: new Date(reset + 60000) }
      },
      { upsert: true, returnDocument: 'after' }
    )

    const doc =
      result && Object.prototype.hasOwnProperty.call(result, 'value')
        ? result.value
        : result

    if (!doc || typeof doc.count !== 'number') {
      throw new Error('Unexpected rate limit result')
    }

    return { count: doc.count, reset }
  }

  return async (req, res, next) => {
    const key = String(keyGenerator ? keyGenerator(req) : req.ip)
    const now = Date.now()
    let result

    if (persistent) {
      try {
        result = await dbCount(key, now)
      } catch (err) {
        console.error(
          'Rate limit store error, using memory:',
          err.message
        )
      }
    }

    if (!result) result = memoryCount(key, now)

    const retry = Math.max(
      1,
      Math.ceil((result.reset - now) / 1000)
    )

    res.setHeader('RateLimit-Limit', String(max))
    res.setHeader(
      'RateLimit-Remaining',
      String(Math.max(0, max - result.count))
    )
    res.setHeader('RateLimit-Reset', String(retry))

    if (result.count > max) {
      res.setHeader('Retry-After', String(retry))
      return res.status(429).json({ message })
    }

    return next()
  }
}

const emailKey = (req) =>
  `${req.ip}|${String(
    (req.body && req.body.email) || ''
  ).toLowerCase().slice(0, 100)}`

module.exports = {
  rateLimit,
  globalLimiter: rateLimit({
    name: 'global',
    windowMs: 15 * 60 * 1000,
    max: 600
  }),
  loginLimiter: rateLimit({
    name: 'login',
    persistent: true,
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyGenerator: emailKey,
    message: 'Too many login attempts. Please try again in 15 minutes.'
  }),
  loginIpLimiter: rateLimit({
    name: 'loginip',
    persistent: true,
    windowMs: 15 * 60 * 1000,
    max: 40,
    message: 'Too many login attempts. Please try again in 15 minutes.'
  }),
  registerLimiter: rateLimit({
    name: 'register',
    persistent: true,
    windowMs: 60 * 60 * 1000,
    max: 8,
    message: 'Too many sign-ups from this network. Please try again later.'
  }),
  orderLimiter: rateLimit({
    name: 'order',
    persistent: true,
    windowMs: 60 * 60 * 1000,
    max: 15,
    message: 'Too many orders placed. Please try again later.'
  }),
  adminLimiter: rateLimit({
    name: 'admin',
    windowMs: 60 * 1000,
    max: 120
  })
}