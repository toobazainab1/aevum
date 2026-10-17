const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const { jwtSecret, jwtExpiresIn, jwtIssuer, jwtAudience } = require('../config/env')
const { cleanText, isEmail, passwordProblem } = require('../utils/validate')

const generateToken = (id) =>
  jwt.sign({ id }, jwtSecret, {
    algorithm: 'HS256',
    expiresIn: jwtExpiresIn,
    issuer: jwtIssuer,
    audience: jwtAudience,
  })

// Used to keep login timing the same whether or not the email exists
let dummyHash
const getDummyHash = () => (dummyHash ||= bcrypt.hashSync('aevum-dummy-password-1', User.BCRYPT_ROUNDS))

const publicUser = (u) => ({ _id: u._id, name: u.name, email: u.email, role: u.role })

// ─── POST /api/auth/register ──────────────────────────────────
const register = async (req, res) => {
  try {
    const name  = cleanText(req.body.name, 60)
    const email = cleanText(req.body.email, 254).toLowerCase()
    const password = req.body.password

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }
    if (name.length < 2) return res.status(400).json({ message: 'Please enter your full name' })
    if (!isEmail(email)) return res.status(400).json({ message: 'Please enter a valid email' })
    const pwProblem = passwordProblem(password, email)
    if (pwProblem) return res.status(400).json({ message: pwProblem })

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'An account with this email already exists' })
    }

    // role is never taken from the request: new accounts are always plain users
    const user = await User.create({ name, email, password, role: 'user' })

    res.status(201).json({ user: publicUser(user), token: generateToken(user._id) })
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(400).json({ message: 'An account with this email already exists' })
    }
    console.error('Register error:', error.message)
    res.status(500).json({ message: 'Server error during registration' })
  }
}

// ─── POST /api/auth/login ─────────────────────────────────────
const login = async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase().slice(0, 254) : ''
    const password = typeof req.body.password === 'string' ? req.body.password.slice(0, 200) : ''

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      await bcrypt.compare(password, getDummyHash()) // equalise timing
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Upgrade older, weaker hashes (cost < 12) transparently on successful login
    if (bcrypt.getRounds(user.password) < User.BCRYPT_ROUNDS) {
      const upgraded = await bcrypt.hash(password, User.BCRYPT_ROUNDS)
      await User.updateOne({ _id: user._id }, { $set: { password: upgraded } })
    }

    res.json({ user: publicUser(user), token: generateToken(user._id) })
  } catch (error) {
    console.error('Login error:', error.message)
    res.status(500).json({ message: 'Server error during login' })
  }
}

// ─── GET /api/auth/me  (protected) ───────────────────────────
const getMe = async (req, res) => {
  res.json(publicUser(req.user))
}

// ─── GET /api/auth/users  (admin only) ───────────────────────
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).limit(2000)
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { register, login, getMe, getAllUsers }
