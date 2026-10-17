// Stores payment screenshots.
//  • Cloudinary configured  -> uploaded as a PRIVATE ("authenticated") asset. Nobody can open it by URL;
//    the server downloads it with a signed request and only after checking the user may see it.
//  • Cloudinary not configured -> saved on local disk (fine for development; lost on free hosts).
// No npm packages needed: uses Node 18+ built-in fetch/FormData and crypto.
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { detectImageType } = require('./fileType')

const UPLOAD_DIR = path.resolve(__dirname, '../uploads/payments')
const CLOUD_FOLDER = 'aevum/payments'
const CLOUD_REF = /^cld:(aevum\/payments\/payment-[a-f0-9]{32})\.(jpg|jpeg|png|webp)$/
const LOCAL_NAME = /^payment-[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$/i
const TIMEOUT_MS = 25000

// Reads CLOUDINARY_URL (cloudinary://KEY:SECRET@CLOUD) or the three separate variables.
function cloudConfig() {
  let cloud = process.env.CLOUDINARY_CLOUD_NAME
  let key = process.env.CLOUDINARY_API_KEY
  let secret = process.env.CLOUDINARY_API_SECRET
  if ((!cloud || !key || !secret) && process.env.CLOUDINARY_URL) {
    const m = /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/.exec(process.env.CLOUDINARY_URL.trim())
    if (m) { key = m[1]; secret = m[2]; cloud = m[3] }
  }
  if (cloud && key && secret) return { cloud: cloud.trim(), key: key.trim(), secret: secret.trim() }
  return null
}

// Cloudinary request signature: sha1 of "k=v&k=v" (sorted keys) + api_secret
function sign(params, secret) {
  const toSign = Object.keys(params)
    .filter(k => params[k] !== undefined && params[k] !== '')
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&')
  return crypto.createHash('sha1').update(toSign + secret).digest('hex')
}

const apiUrl = (cfg, action) => `https://api.cloudinary.com/v1_1/${encodeURIComponent(cfg.cloud)}/image/${action}`

function needFetch() {
  if (typeof fetch !== 'function' || typeof FormData === 'undefined' || typeof Blob === 'undefined') {
    throw new Error('Cloudinary uploads need Node.js 18 or newer')
  }
}

// Saves a validated image buffer and returns a reference string to store in the database.
async function saveImage(buffer, mime) {
  const type = detectImageType(buffer.subarray(0, 12))
  if (!type || type.mime !== mime) throw new Error('Invalid image data')
  const name = `payment-${crypto.randomBytes(16).toString('hex')}`
  const cfg = cloudConfig()

  if (!cfg) {
<<<<<<< HEAD
=======
    if (process.env.VERCEL) throw new Error('CLOUDINARY_URL is not set: payment screenshots cannot be stored on Vercel without it')
>>>>>>> 1fc1e36 (Vercel serverless backend)
    await fs.promises.mkdir(UPLOAD_DIR, { recursive: true, mode: 0o700 })
    const file = `${name}${type.ext}`
    await fs.promises.writeFile(path.join(UPLOAD_DIR, file), buffer, { mode: 0o600 })
    return `/uploads/payments/${file}`
  }

  needFetch()
  const params = { public_id: `${CLOUD_FOLDER}/${name}`, timestamp: Math.floor(Date.now() / 1000), type: 'authenticated' }
  const form = new FormData()
  form.append('file', new Blob([buffer], { type: type.mime }), `${name}${type.ext}`)
  for (const [k, v] of Object.entries(params)) form.append(k, String(v))
  form.append('api_key', cfg.key)
  form.append('signature', sign(params, cfg.secret))

  const res = await fetch(apiUrl(cfg, 'upload'), { method: 'POST', body: form, signal: AbortSignal.timeout(TIMEOUT_MS) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.public_id || !data.format) {
    throw new Error(`Cloudinary upload failed (${res.status}): ${(data.error && data.error.message) || 'unknown error'}`)
  }
  return `cld:${data.public_id}.${data.format}`
}

// Returns { buffer, mime } or null. Works for Cloudinary refs and for older local refs.
async function getImage(ref) {
  try {
    if (typeof ref !== 'string' || !ref) return null

    if (ref.startsWith('cld:')) {
      const m = CLOUD_REF.exec(ref)
      const cfg = cloudConfig()
      if (!m || !cfg) return null
      needFetch()
      const params = { format: m[2], public_id: m[1], timestamp: Math.floor(Date.now() / 1000), type: 'authenticated' }
      const qs = new URLSearchParams({ ...params, timestamp: String(params.timestamp), api_key: cfg.key, signature: sign(params, cfg.secret) })
      const res = await fetch(`${apiUrl(cfg, 'download')}?${qs}`, { signal: AbortSignal.timeout(TIMEOUT_MS) })
      if (!res.ok) { console.error(`Cloudinary download failed (${res.status})`); return null }
      const buffer = Buffer.from(await res.arrayBuffer())
      const type = detectImageType(buffer.subarray(0, 12))
      return type ? { buffer, mime: type.mime } : null
    }

    // legacy / local file
    const filename = path.basename(ref)
    if (!LOCAL_NAME.test(filename)) return null
    const full = path.join(UPLOAD_DIR, filename)
    if (!full.startsWith(UPLOAD_DIR + path.sep)) return null
    const buffer = await fs.promises.readFile(full)
    const type = detectImageType(buffer.subarray(0, 12))
    return type ? { buffer, mime: type.mime } : null
  } catch (err) {
    console.error('getImage error:', err.message)
    return null
  }
}

// Best-effort cleanup (never throws).
async function deleteImage(ref) {
  try {
    if (typeof ref !== 'string') return
    const m = CLOUD_REF.exec(ref)
    if (m) {
      const cfg = cloudConfig()
      if (!cfg) return
      needFetch()
      const params = { public_id: m[1], timestamp: Math.floor(Date.now() / 1000), type: 'authenticated' }
      const form = new FormData()
      for (const [k, v] of Object.entries(params)) form.append(k, String(v))
      form.append('api_key', cfg.key)
      form.append('signature', sign(params, cfg.secret))
      await fetch(apiUrl(cfg, 'destroy'), { method: 'POST', body: form, signal: AbortSignal.timeout(TIMEOUT_MS) })
    } else {
      const filename = path.basename(ref)
      if (LOCAL_NAME.test(filename)) await fs.promises.unlink(path.join(UPLOAD_DIR, filename))
    }
  } catch (err) {
    console.error('deleteImage error:', err.message)
  }
}

module.exports = { saveImage, getImage, deleteImage, cloudConfig, sign, isCloud: () => !!cloudConfig() }
