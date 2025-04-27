const express = require('express');
const router = express.Router();
const manufacturerController = require('../controllers/manufacturerController');

// Receive new order from supplier
router.post('/new-order', manufacturerController.receiveOrder);

// Get new orders (status: Accepted)
router.get('/new-orders', manufacturerController.getNewOrders);

// Get orders in production
router.get('/orders-in-production', manufacturerController.getOrdersInProduction);

// Get completed orders
router.get('/completed-orders', manufacturerController.getCompletedOrders);

// Create product
router.post('/create-product', manufacturerController.createProduct);

// Complete production
router.post('/complete-production', manufacturerController.completeProduction);

module.exports = router;