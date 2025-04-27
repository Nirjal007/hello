const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController.js');

// Receive order from retailer
router.post('/receive-order', supplierController.receiveOrder);

// Get all pending orders
router.get('/pending-orders', supplierController.getPendingOrders);

// Get orders in production
router.get('/orders-in-production', supplierController.getOrdersInProduction);

// Update order status
router.patch('/update-order-status', supplierController.updateOrderStatus);

// Forward order to manufacturer
router.patch('/forward-to-manufacturer', supplierController.forwardToManufacturer);

// Get material inventory
router.get('/material-inventory', supplierController.getMaterialInventory);

// Update material stock
router.patch('/update-material-stock', supplierController.updateMaterialStock);

module.exports = router;