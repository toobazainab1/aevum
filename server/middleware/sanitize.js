// Blocks NoSQL operator injection ({"$ne": ...}, "a.b" keys) and prototype pollution.
const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

function sanitizeDeep(value, depth = 0) {
  if (value === null || typeof value !== 'object') return value
  if (depth > 8) return Array.isArray(value) ? [] : {}
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) value[i] = sanitizeDeep(value[i], depth + 1)
    return value
  }
  for (const key of Object.keys(value)) {
    if (key.startsWith('$') || key.includes('.') || BAD_KEYS.has(key)) delete value[key]
    else value[key] = sanitizeDeep(value[key], depth + 1)
  }
  return value
}

const sanitizeRequest = (req, res, next) => {
  if (req.body) sanitizeDeep(req.body)
  if (req.query) sanitizeDeep(req.query)
  if (req.params) sanitizeDeep(req.params)
  next()
}

module.exports = { sanitizeRequest, sanitizeDeep }
