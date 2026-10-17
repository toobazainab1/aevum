const { isProd } = require('../config/env')

// Security headers for a JSON API (same intent as helmet, without the extra dependency).
module.exports = (req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'")
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
  res.setHeader('X-DNS-Prefetch-Control', 'off')
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none')
  res.setHeader('Cache-Control', 'no-store')
  if (isProd) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  next()
}
