// Small in-memory rate limiter (per server instance). Fine for a single-instance deployment.
// If you scale to several instances, move to a shared store (e.g. Redis).
const MAX_KEYS = 100000

function rateLimit({ windowMs, max, message = 'Too many requests, please try again later.', keyGenerator }) {
  const hits = new Map()

  const sweep = () => {
    const now = Date.now()
    for (const [k, v] of hits) if (v.reset <= now) hits.delete(k)
  }
  setInterval(sweep, Math.min(windowMs, 60000)).unref()

  return (req, res, next) => {
    const key = keyGenerator ? keyGenerator(req) : req.ip
    const now = Date.now()
    let entry = hits.get(key)
    if (!entry || entry.reset <= now) {
      if (hits.size >= MAX_KEYS) sweep()
      entry = { count: 0, reset: now + windowMs }
      hits.set(key, entry)
    }
    entry.count += 1
    const retry = Math.max(1, Math.ceil((entry.reset - now) / 1000))
    res.setHeader('RateLimit-Limit', String(max))
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - entry.count)))
    res.setHeader('RateLimit-Reset', String(retry))
    if (entry.count > max) {
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
  globalLimiter:   rateLimit({ windowMs: 15 * 60 * 1000, max: 600 }),
  loginLimiter:    rateLimit({ windowMs: 15 * 60 * 1000, max: 10, keyGenerator: emailKey, message: 'Too many login attempts. Please try again in 15 minutes.' }),
  loginIpLimiter:  rateLimit({ windowMs: 15 * 60 * 1000, max: 40, message: 'Too many login attempts. Please try again in 15 minutes.' }),
  registerLimiter: rateLimit({ windowMs: 60 * 60 * 1000, max: 8, message: 'Too many sign-ups from this network. Please try again later.' }),
  orderLimiter:    rateLimit({ windowMs: 60 * 60 * 1000, max: 15, message: 'Too many orders placed. Please try again later.' }),
  adminLimiter:    rateLimit({ windowMs: 60 * 1000, max: 120 }),
}
