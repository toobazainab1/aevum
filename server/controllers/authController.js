const jwt = require('jsonwebtoken')
const User = require('../models/User')

// Helper: generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' })
}

// ─── POST /api/auth/register ──────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    // Check duplicate email
    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists' })
    }

    // Create user (password hashed by pre-save hook in model)
    const user = await User.create({ name, email, password })

    res.status(201).json({
      user: {
        _id:   user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
      token: generateToken(user._id),
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ message: 'Server error during registration' })
  }
}

// ─── POST /api/auth/login ─────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    res.json({
      user: {
        _id:   user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
      token: generateToken(user._id),
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error during login' })
  }
}

// ─── GET /api/auth/me  (protected) ───────────────────────────
const getMe = async (req, res) => {
  try {
    // req.user is set by protect middleware
    res.json({
      _id:   req.user._id,
      name:  req.user.name,
      email: req.user.email,
      role:  req.user.role,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// ─── GET /api/auth/users  (admin only) ───────────────────────
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 })
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { register, login, getMe, getAllUsers }