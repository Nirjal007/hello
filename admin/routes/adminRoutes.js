const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Get system-wide statistics
router.get('/system-stats', adminController.getSystemStats);

// Get detailed order analytics
router.get('/order-analytics', adminController.getOrderAnalytics);

// Get inventory analytics
router.get('/inventory-analytics', adminController.getInventoryAnalytics);

// Get user statistics
router.get('/user-stats', adminController.getUserStats);

module.exports = router;