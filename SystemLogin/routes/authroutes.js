// routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Register a new user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// 2FA endpoints - make sure these match the frontend calls
router.post("/enable-2fa", authController.sendOTP);  // Use authController.sendOTP
router.post("/verify-2fa", authController.verifyOTP); // Use authController.verifyOTP

module.exports = router;