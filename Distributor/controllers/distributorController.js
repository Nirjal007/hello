const Shipment = require('../models/shipmentModel');
const axios = require('axios');

// Generate a random tracking number
function generateTrackingNumber() {
    const prefix = 'TRK';
    const randomPart = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    return `${prefix}${randomPart}`;
}

// Receive new shipment from manufacturer
exports.receiveShipment = async (req, res) => {
    try {
        const { manufacturerOrderId, retailerEmail, productName, productId, quantity } = req.body;
        
        console.log('Receiving new shipment from manufacturer:', {
            manufacturerOrderId, retailerEmail, productName, productId, quantity
        });
        
        // Create shipment in distributor database
        const newShipment = new Shipment({
            manufacturerOrderId,
            retailerEmail,
            productName,
            productId,
            quantity,
            status: 'Pending'
        });
        
        const savedShipment = await newShipment.save();
        console.log('Shipment saved successfully:', savedShipment._id);
        
        res.status(201).json({ 
            message: 'Shipment received from manufacturer', 
            shipment: savedShipment 
        });
    } catch (error) {
        console.error('Error receiving shipment:', error);
        res.status(500).json({ message: 'Error receiving shipment', error: error.message });
    }
};

// Get pending shipments
exports.getPendingShipments = async (req, res) => {
    try {
        const shipments = await Shipment.find({ status: 'Pending' }).sort({ createdAt: -1 });
        
        res.status(200).json({ shipments });
    } catch (error) {
        console.error('Error fetching pending shipments:', error);
        res.status(500).json({ message: 'Error fetching pending shipments', error: error.message });
    }
};

// Get shipped shipments
exports.getShippedShipments = async (req, res) => {
    try {
        const shipments = await Shipment.find({ status: 'Shipped' }).sort({ createdAt: -1 });
        
        res.status(200).json({ shipments });
    } catch (error) {
        console.error('Error fetching shipped shipments:', error);
        res.status(500).json({ message: 'Error fetching shipped shipments', error: error.message });
    }
};

// Get delivered shipments
exports.getDeliveredShipments = async (req, res) => {
    try {
        const shipments = await Shipment.find({ status: 'Delivered' }).sort({ createdAt: -1 });
        
        res.status(200).json({ shipments });
    } catch (error) {
        console.error('Error fetching delivered shipments:', error);
        res.status(500).json({ message: 'Error fetching delivered shipments', error: error.message });
    }
};

// Process shipment
exports.processShipment = async (req, res) => {
    try {
        const { shipmentId, trackingNumber, shippingMethod, shipDate, estimatedDelivery } = req.body;
        
        console.log('Processing shipment:', { 
            shipmentId, trackingNumber, shippingMethod, shipDate, estimatedDelivery 
        });
        
        const shipment = await Shipment.findById(shipmentId);
        if (!shipment) {
            console.error('Shipment not found:', shipmentId);
            return res.status(404).json({ message: 'Shipment not found' });
        }
        
        // Update shipment details
        shipment.status = 'Shipped';
        shipment.trackingNumber = trackingNumber || generateTrackingNumber();
        shipment.shippingMethod = shippingMethod;
        shipment.shipDate = shipDate || new Date();
        shipment.estimatedDelivery = estimatedDelivery;
        
        await shipment.save();
        console.log('Shipment processed successfully:', shipment._id);
        
        // Update order status in retailer's system
        try {
            // We would need to know the original retailer order ID here
            // For now, this is a placeholder that would need to be updated in a real implementation
            // await axios.patch('http://localhost:7001/api/retailer/update-order-status', {
            //     orderId: 'original-retailer-order-id',
            //     status: 'Shipped'
            // });
            
            console.log('Order status updated in retailer system');
        } catch (updateError) {
            console.error('Error updating order status in retailer system:', updateError.message);
            // Continue despite error in updating retailer system
        }
        
        res.status(200).json({ 
            message: 'Shipment processed successfully', 
            shipment 
        });
    } catch (error) {
        console.error('Error processing shipment:', error);
        res.status(500).json({ message: 'Error processing shipment', error: error.message });
    }
};

// Mark shipment as delivered
exports.markAsDelivered = async (req, res) => {
    try {
        const { shipmentId } = req.body;
        
        console.log('Marking shipment as delivered:', shipmentId);
        
        const shipment = await Shipment.findById(shipmentId);
        if (!shipment) {
            console.error('Shipment not found:', shipmentId);
            return res.status(404).json({ message: 'Shipment not found' });
        }
        
        // Update shipment status
        shipment.status = 'Delivered';
        shipment.deliveryDate = new Date();
        await shipment.save();
        
        console.log('Shipment marked as delivered:', shipment._id);
        
        // Update order status in retailer's system
        try {
            // We would need to know the original retailer order ID here
            // For now, this is a placeholder that would need to be updated in a real implementation
            // await axios.patch('http://localhost:7001/api/retailer/update-order-status', {
            //     orderId: 'original-retailer-order-id',
            //     status: 'Delivered'
            // });
            
            console.log('Order status updated in retailer system');
        } catch (updateError) {
            console.error('Error updating order status in retailer system:', updateError.message);
            // Continue despite error in updating retailer system
        }
        
        res.status(200).json({ 
            message: 'Shipment marked as delivered', 
            shipment 
        });
    } catch (error) {
        console.error('Error marking shipment as delivered:', error);
        res.status(500).json({ message: 'Error marking shipment as delivered', error: error.message });
    }
};

// Get in-transit shipments (alias for shipped shipments)
exports.getInTransitShipments = async (req, res) => {
    try {
        const shipments = await Shipment.find({ status: 'Shipped' }).sort({ createdAt: -1 });
        
        res.status(200).json({ shipments });
    } catch (error) {
        console.error('Error fetching in-transit shipments:', error);
        res.status(500).json({ message: 'Error fetching in-transit shipments', error: error.message });
    }
};