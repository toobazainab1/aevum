// Checks your Gmail settings without placing an order.
// Usage:  node scripts/testEmail.js            (only verifies the login)
//         node scripts/testEmail.js you@x.com  (also sends a test email)
require('dotenv').config()
const nodemailer = require('nodemailer')

const user = (process.env.EMAIL_USER || '').trim()
const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '') // Google shows app passwords with spaces; they are not part of it

if (!user || !pass) { console.error('EMAIL_USER or EMAIL_PASS is missing in server/.env'); process.exit(1) }
console.log(`Account: ${user}`)
console.log(`App password length: ${pass.length} (should be 16)`)

const t = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } })
t.verify()
  .then(async () => {
    console.log('✅ Gmail login works')
    const to = process.argv[2]
    if (to) {
      await t.sendMail({ from: `"AEVUM" <${user}>`, to, subject: 'AEVUM test email', text: 'Email sending works.' })
      console.log(`✅ Test email sent to ${to}`)
    }
  })
  .catch(e => { console.error('❌', e.message); process.exit(1) })
