// Loads and validates environment variables. The server refuses to start with unsafe config.
require('dotenv').config()

const fail = (msg) => { console.error(`FATAL config error: ${msg}`); process.exit(1) }

const isProd = process.env.NODE_ENV === 'production'

if (!process.env.MONGO_URI) fail('MONGO_URI is not set')
if (!process.env.JWT_SECRET) fail('JWT_SECRET is not set')
if (process.env.JWT_SECRET.length < 32) {
  fail('JWT_SECRET must be at least 32 characters. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"')
}

// Allowed browser origins for CORS (comma separated).
const defaultOrigins = ['https://aevum-ashy.vercel.app']
if (!isProd) defaultOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173')
const clientOrigins = (process.env.CLIENT_ORIGINS || defaultOrigins.join(','))
  .split(',').map(s => s.trim().replace(/\/+$/, '')).filter(Boolean)

// Number of reverse proxies in front of the app (Render/Railway/Heroku = 1). Needed for correct client IPs.
const trustProxy = process.env.TRUST_PROXY !== undefined
  ? Number(process.env.TRUST_PROXY)
  : (isProd ? 1 : 0)

module.exports = {
  isProd,
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtIssuer: 'aevum-api',
  jwtAudience: 'aevum-web',
  clientOrigins,
  trustProxy: Number.isFinite(trustProxy) ? trustProxy : 0,
}
