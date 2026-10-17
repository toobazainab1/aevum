// Promote an existing user to admin (there is deliberately no public way to become admin).
// Usage:  node scripts/makeAdmin.js user@example.com
const config = require('../config/env')
const mongoose = require('mongoose')
const User = require('../models/User')

const email = String(process.argv[2] || '').trim().toLowerCase()
if (!email) { console.error('Usage: node scripts/makeAdmin.js user@example.com'); process.exit(1) }

mongoose.connect(config.mongoUri)
  .then(() => User.findOneAndUpdate({ email }, { $set: { role: 'admin' } }, { new: true }))
  .then(u => { console.log(u ? `${u.email} is now an admin` : 'No user with that email'); return mongoose.disconnect() })
  .catch(e => { console.error(e.message); process.exit(1) })
