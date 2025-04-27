const Order = require('../models/orderModel');
const axios = require('axios');

// Receive new order from supplier
exports.receiveOrder = async (req, res) => {
    try {
        const { supplierOrderId, retailerEmail, productName, productMaterial, quantity } = req.body;
        
        console.log('Received order from supplier:', { 
            supplierOrderId, retailerEmail, productName, productMaterial, quantity 
        });
        
        // Create order in manufacturer database
        const newOrder = new Order({
            supplierOrderId,
            retailerEmail,
            productName,
            productMaterial,
            quantity,
            status: 'Accepted'
        });
        
        const savedOrder = await newOrder.save();
        console.log('Order saved to manufacturer database:', savedOrder._id);
        
        res.status(201).json({ 
            message: 'Order received from supplier', 
            order: savedOrder 
        });
    } catch (error) {
        console.error('Error receiving order:', error);
        res.status(500).json({ message: 'Error receiving order', error: error.message });
    }
};

// Get new orders (status: Accepted)
exports.getNewOrders = async (req, res) => {
    try {
        const orders = await Order.find({ status: 'Accepted' }).sort({ createdAt: -1 });
        
        res.status(200).json({ orders });
    } catch (error) {
        console.error('Error fetching new orders:', error);
        res.status(500).json({ message: 'Error fetching new orders', error: error.message });
    }
};

// Get orders in production
exports.getOrdersInProduction = async (req, res) => {
    try {
        const orders = await Order.find({ status: 'In Production' }).sort({ createdAt: -1 });
        
        res.status(200).json({ orders });
    } catch (error) {
        console.error('Error fetching orders in production:', error);
        res.status(500).json({ message: 'Error fetching orders in production', error: error.message });
    }
};

// Get completed orders
exports.getCompletedOrders = async (req, res) => {
    try {
        const orders = await Order.find({ status: 'Production Completed' }).sort({ createdAt: -1 });
        
        res.status(200).json({ orders });
    } catch (error) {
        console.error('Error fetching completed orders:', error);
        res.status(500).json({ message: 'Error fetching completed orders', error: error.message });
    }
};

// Create product
exports.createProduct = async (req, res) => {
    try {
        const { orderId, productId, brand, color, manufacturedLocation, manufacturedDate } = req.body;
        
        console.log('Creating product for order:', orderId);
        
        const order = await Order.findById(orderId);
        if (!order) {
            console.error('Order not found for creating product:', orderId);
            return res.status(404).json({ message: 'Order not found' });
        }
        
        // Update order with product details
        order.productId = productId;
        order.brand = brand;
        order.color = color;
        order.manufacturedLocation = manufacturedLocation;
        order.manufacturedDate = manufacturedDate;
        order.status = 'In Production';
        
        await order.save();
        console.log('Order updated with product details:', order._id);
        
        // Update supplier's order status
        try {
            await axios.patch('http://localhost:7002/api/supplier/update-order-status', {
                orderId: order.supplierOrderId,
                status: 'In Production'
            });
            
            console.log('Supplier order status updated to In Production');
        } catch (updateError) {
            console.error('Error updating supplier order status:', updateError.message);
            // Continue despite error in updating supplier system
        }
        
        res.status(200).json({ 
            message: 'Product created successfully', 
            order 
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Error creating product', error: error.message });
    }
};

// Complete production
exports.completeProduction = async (req, res) => {
    try {
        const { orderId } = req.body;
        
        console.log('Completing production for order:', orderId);
        
        const order = await Order.findById(orderId);
        if (!order) {
            console.error('Order not found for completing production:', orderId);
            return res.status(404).json({ message: 'Order not found' });
        }
        
        // Update order status
        order.status = 'Production Completed';
        await order.save();
        console.log('Order status updated to Production Completed');
        
        // Update supplier's order status
        try {
            await axios.patch('http://localhost:7002/api/supplier/update-order-status', {
                orderId: order.supplierOrderId,
                status: 'Shipped' // Use Shipped instead of Production Completed
            });
            
            console.log('Supplier order status updated to Shipped');
        } catch (updateError) {
            console.error('Error updating supplier order status:', updateError.message);
            // Continue despite error in updating supplier system
        }
        
        // Forward to distributor - FIXED the endpoint name
        try {
            await axios.post('http://localhost:7004/api/distributor/receive-shipment', {
                manufacturerOrderId: order._id,
                retailerEmail: order.retailerEmail,
                productName: order.productName,
                productId: order.productId,
                quantity: order.quantity
            });
            
            console.log('Order forwarded to distributor for shipping');
        } catch (forwardError) {
            console.error('Error forwarding order to distributor:', forwardError.message);
            // Continue despite error in forwarding to distributor
        }
        
        res.status(200).json({ 
            message: 'Production completed successfully', 
            order 
        });
    } catch (error) {
        console.error('Error completing production:', error);
        res.status(500).json({ message: 'Error completing production', error: error.message });
    }
};