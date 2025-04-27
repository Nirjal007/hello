const { Order, Material } = require('../models/orderModel');
const axios = require('axios');

// Initialize material inventory if not exists
const initializeMaterialInventory = async () => {
    try {
        const materialsExist = await Material.countDocuments();
        
        if (materialsExist === 0) {
            console.log('No materials found. Initializing default materials.');
            
            const defaultMaterials = [
                { name: 'Leather', stock: 100 },
                { name: 'Plastic', stock: 150 },
                { name: 'Metal', stock: 80 },
                { name: 'Wood', stock: 120 },
                { name: 'Fabric', stock: 200 }
            ];
            
            await Material.insertMany(defaultMaterials);
            console.log('Default materials initialized');
        } else {
            console.log('Materials already exist in the database:', materialsExist);
        }
    } catch (error) {
        console.error('Error initializing materials:', error);
    }
};

// Export the initializeMaterialInventory function so it can be called from server.js
exports.initializeMaterialInventory = initializeMaterialInventory;

// Call this when the controller is loaded
initializeMaterialInventory();

// Receive order from retailer
exports.receiveOrder = async (req, res) => {
    try {
        const { orderId, retailerEmail, productName, productMaterial, quantity } = req.body;
        
        // Create order in supplier database
        const newOrder = new Order({
            originalOrderId: orderId,
            retailerEmail,
            productName,
            productMaterial,
            quantity,
            status: 'Pending'
        });
        
        const savedOrder = await newOrder.save();
        
        res.status(201).json({ 
            message: 'Order received from retailer', 
            order: savedOrder 
        });
    } catch (error) {
        console.error('Error receiving order:', error);
        res.status(500).json({ message: 'Error receiving order', error: error.message });
    }
};

// Get all pending orders
exports.getPendingOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        
        res.status(200).json({ orders });
    } catch (error) {
        console.error('Error fetching pending orders:', error);
        res.status(500).json({ message: 'Error fetching pending orders', error: error.message });
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

// Update order status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status, productId, brand, color, manufacturedLocation, manufacturedDate } = req.body;
        
        console.log('Updating order status:', { orderId, status });
        
        const order = await Order.findById(orderId);
        if (!order) {
            console.error('Order not found:', orderId);
            return res.status(404).json({ message: 'Order not found' });
        }
        
        // Check if we need to decrease material stock when accepting an order
        if (status === 'Accepted' && order.status === 'Pending') {
            const material = await Material.findOne({ name: order.productMaterial });
            
            if (!material) {
                console.error('Material not found:', order.productMaterial);
                return res.status(404).json({ message: `Material ${order.productMaterial} not found` });
            }
            
            console.log('Material stock check:', { 
                material: order.productMaterial, 
                requiredQuantity: order.quantity, 
                availableStock: material.stock 
            });
            
            if (material.stock < order.quantity) {
                console.error('Not enough material in stock:', { 
                    material: order.productMaterial, 
                    required: order.quantity, 
                    available: material.stock 
                });
                return res.status(400).json({ message: `Not enough ${order.productMaterial} in stock (needed: ${order.quantity}, available: ${material.stock})` });
            }
            
            // Reduce material stock
            material.stock -= order.quantity;
            await material.save();
            console.log('Stock reduced:', { material: order.productMaterial, newStock: material.stock });
        }
        
        // Update order status
        order.status = status;
        
        // If the request includes product details, update them
        if (productId) order.productId = productId;
        if (brand) order.brand = brand;
        if (color) order.color = color;
        if (manufacturedLocation) order.manufacturedLocation = manufacturedLocation;
        if (manufacturedDate) order.manufacturedDate = manufacturedDate;
        
        await order.save();
        console.log('Order updated successfully:', order._id);
        
        // Update the status in the retailer's system
        try {
            await axios.patch('http://localhost:7001/api/retailer/update-order-status', {
                orderId: order.originalOrderId,
                status
            });
            
            console.log('Order status updated in retailer system');
        } catch (updateError) {
            console.error('Error updating order status in retailer system:', updateError.message);
            // Continue despite error in updating retailer system
        }
        
        res.status(200).json({ 
            message: 'Order status updated successfully', 
            order 
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Error updating order status', error: error.message });
    }
};

// Forward order to manufacturer
exports.forwardToManufacturer = async (req, res) => {
    try {
        const { orderId, manufacturerId } = req.body;
        
        console.log('Forwarding order to manufacturer:', { orderId, manufacturerId });
        
        const order = await Order.findById(orderId);
        if (!order) {
            console.error('Order not found for forwarding:', orderId);
            return res.status(404).json({ message: 'Order not found' });
        }
        
        // Update the order
        order.status = 'Accepted';
        order.manufacturerId = manufacturerId;
        await order.save();
        console.log('Order marked as accepted and assigned to manufacturer:', manufacturerId);
        
        // Forward to manufacturer
        try {
            const response = await axios.post('http://localhost:7003/api/manufacturer/new-order', {
                supplierOrderId: order._id,
                retailerEmail: order.retailerEmail,
                productName: order.productName,
                productMaterial: order.productMaterial,
                quantity: order.quantity
            });
            
            console.log('Order forwarded to manufacturer successfully:', response.data);
        } catch (forwardError) {
            console.error('Error forwarding order to manufacturer:', forwardError.message);
            // Continue despite error in forwarding to manufacturer
        }
        
        // Update the status in the retailer's system
        try {
            await axios.patch('http://localhost:7001/api/retailer/update-order-status', {
                orderId: order.originalOrderId,
                status: 'Accepted'
            });
            
            console.log('Order status updated in retailer system');
        } catch (updateError) {
            console.error('Error updating order status in retailer system:', updateError.message);
            // Continue despite error in updating retailer system
        }
        
        res.status(200).json({ 
            message: 'Order forwarded to manufacturer', 
            order 
        });
    } catch (error) {
        console.error('Error forwarding order to manufacturer:', error);
        res.status(500).json({ message: 'Error forwarding order to manufacturer', error: error.message });
    }
};

// Get material inventory
exports.getMaterialInventory = async (req, res) => {
    try {
        const materials = await Material.find();
        
        res.status(200).json({ materials });
    } catch (error) {
        console.error('Error fetching material inventory:', error);
        res.status(500).json({ message: 'Error fetching material inventory', error: error.message });
    }
};

// Update material stock
exports.updateMaterialStock = async (req, res) => {
    try {
        const { materialId, stock } = req.body;
        
        const material = await Material.findById(materialId);
        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }
        
        material.stock = stock;
        await material.save();
        
        res.status(200).json({ 
            message: 'Material stock updated successfully', 
            material 
        });
    } catch (error) {
        console.error('Error updating material stock:', error);
        res.status(500).json({ message: 'Error updating material stock', error: error.message });
    }
};