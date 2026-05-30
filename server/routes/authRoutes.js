const express = require('express')
const router = express.Router()
const { register, login, getMe, getAllUsers } = require('../controllers/authController')
const { protect, adminOnly } = require('../middleware/authMiddleware')

// Public
router.post('/register', register)
router.post('/login',    login)

// Protected
router.get('/me', protect, getMe)

// Admin
router.get('/users', protect, adminOnly, getAllUsers)

module.exports = router