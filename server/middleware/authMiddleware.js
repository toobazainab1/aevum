const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { jwtSecret, jwtIssuer, jwtAudience } = require('../config/env')
const { isObjectId } = require('../utils/validate')

// ─── Protect: requires valid JWT ──────────────────────────────
const protect = async (req, res, next) => {
  const header = req.headers.authorization
  const token = header && header.startsWith('Bearer ') ? header.slice(7).trim() : null

  if (!token) {
    return res.status(401).json({ message: 'Not authorised, no token' })
  }

  try {
    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256'],
      issuer: jwtIssuer,
      audience: jwtAudience,
    })
    if (!isObjectId(decoded.id)) throw new Error('bad subject')

    // Role is always read fresh from the database, never trusted from the token
    req.user = await User.findById(decoded.id).select('-password')
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorised, user not found' })
    }
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Not authorised, token invalid' })
  }
}

// ─── Admin: requires role === 'admin' ─────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next()
  return res.status(403).json({ message: 'Admin access only' })
}

// Rejects malformed :id params early (404 instead of a CastError/500)
const validateId = (req, res, next, id) => {
  if (!isObjectId(id)) return res.status(404).json({ message: 'Not found' })
  next()
}

module.exports = { protect, adminOnly, validateId }
