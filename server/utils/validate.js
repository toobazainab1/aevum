// Input cleaning helpers. React escapes output on the web, but we still strip markup
// from stored text and escape again anywhere HTML is built (emails).
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
const TAGS = /<[^>]*>?/g

const OBJECT_ID = /^[a-f\d]{24}$/i
const isObjectId = (v) => typeof v === 'string' && OBJECT_ID.test(v)

// Always returns a string: strips control chars, HTML tags and angle brackets.
function cleanText(value, max = 200) {
  if (typeof value !== 'string' && typeof value !== 'number') return ''
  return String(value).replace(CONTROL, '').replace(TAGS, '').replace(/[<>]/g, '').trim().slice(0, max)
}

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/
const isEmail = (v) => typeof v === 'string' && v.length <= 254 && EMAIL.test(v)

const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890', 'qwerty123',
  'qwertyuiop', 'iloveyou', 'admin123', 'welcome1', 'letmein123', 'abc12345', '11111111', '00000000',
])

// Returns an error message or null.
function passwordProblem(pw, email = '') {
  if (typeof pw !== 'string') return 'Password is required'
  if (pw.length < 8) return 'Password must be at least 8 characters'
  if (Buffer.byteLength(pw, 'utf8') > 72) return 'Password must be at most 72 bytes (about 72 characters)'
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return 'Password must contain at least one letter and one number'
  if (COMMON_PASSWORDS.has(pw.toLowerCase())) return 'That password is too common. Please choose another'
  if (email && pw.toLowerCase() === String(email).toLowerCase()) return 'Password must not be your email'
  return null
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

// Strings only, no operators/objects. Used for query-string values.
const queryString = (v, max = 60) => (typeof v === 'string' ? cleanText(v, max) : '')

module.exports = { cleanText, isObjectId, isEmail, passwordProblem, escapeHtml, queryString }
