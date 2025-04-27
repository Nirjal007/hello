// distributor/routes/distributorRoutes.js
const express = require('express');
const router = express.Router();
const distributorController = require('../controllers/distributorController');

// Get pending shipments
router.get('/pending-shipments', distributorController.getPendingShipments);

// Get shipped shipments
router.get('/shipped-shipments', distributorController.getShippedShipments);

// Get delivered shipments
router.get('/delivered-shipments', distributorController.getDeliveredShipments);

// Get in-transit shipments
router.get('/in-transit-shipments', distributorController.getInTransitShipments);

// Process a shipment
router.post('/process-shipment', distributorController.processShipment);

// Mark shipment as delivered
router.post('/mark-as-delivered', distributorController.markAsDelivered);

// Add this route if missing
router.post('/receive-shipment', distributorController.receiveShipment);

module.exports = router;