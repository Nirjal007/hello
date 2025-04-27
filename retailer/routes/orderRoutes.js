const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Place a new order
router.post('/place-order', orderController.placeOrder);

// Get all orders (not filtered by email)
router.get('/orders', orderController.getAllOrders);

// Get all orders for a retailer
router.get('/orders/:email', orderController.getOrders);


// Update order status (will be called by supplier's API)
router.patch('/update-order-status', orderController.updateOrderStatus);

module.exports = router;