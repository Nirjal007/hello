const Order = require('../models/orderModel');
const axios = require('axios');

// Place a new order
exports.placeOrder = async (req, res) => {
    try {
        const { retailerEmail, productName, productMaterial, quantity } = req.body;
        
        // Create order in retailer database
        const newOrder = new Order({
            retailerEmail,
            productName,
            productMaterial,
            quantity
        });
        
        const savedOrder = await newOrder.save();
        
        // Forward order to supplier system
        try {
            await axios.post('http://localhost:7002/api/supplier/receive-order', {
                orderId: savedOrder._id,
                retailerEmail,
                productName,
                productMaterial,
                quantity,
                status: 'Pending'
            });
            
            console.log('Order forwarded to supplier');
        } catch (forwardError) {
            console.error('Error forwarding order to supplier:', forwardError);
            // We still return success even if forwarding fails, as the order was saved locally
        }
        
        res.status(201).json({ 
            message: 'Order placed successfully', 
            order: savedOrder 
        });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ message: 'Error placing order', error: error.message });
    }
};

// Get all orders (not filtered by email)
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        
        res.status(200).json({ orders });
    } catch (error) {
        console.error('Error fetching all orders:', error);
        res.status(500).json({ message: 'Error fetching all orders', error: error.message });
    }
};

// Get all orders for a specific retailer
exports.getOrders = async (req, res) => {
    try {
        const { email } = req.params;
        const orders = await Order.find({ retailerEmail: email }).sort({ createdAt: -1 });
        
        res.status(200).json({ orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
};

// Update order status (will be called by supplier's API)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        order.status = status;
        await order.save();
        
        res.status(200).json({ 
            message: 'Order status updated successfully', 
            order 
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Error updating order status', error: error.message });
    }
};