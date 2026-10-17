const express = require('express')
const router = express.Router()
const { register, login, getMe, getAllUsers } = require('../controllers/authController')
const { protect, adminOnly } = require('../middleware/authMiddleware')
const { loginLimiter, loginIpLimiter, registerLimiter, adminLimiter } = require('../middleware/rateLimit')

// Public (rate limited against brute force / mass sign-up)
router.post('/register', registerLimiter, register)
router.post('/login',    loginIpLimiter, loginLimiter, login)

// Protected
router.get('/me', protect, getMe)

// Admin
router.get('/users', adminLimiter, protect, adminOnly, getAllUsers)

module.exports = router
