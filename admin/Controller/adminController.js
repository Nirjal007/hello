const Order = require('../models/orderModel');
const axios = require('axios');

// Get system-wide statistics
exports.getSystemStats = async (req, res) => {
    try {
        // Collect data from all systems
        const [retailerOrders, supplierMaterials] = await Promise.all([
            // Fetch orders from retailer system
            axios.get('http://localhost:7001/api/retailer/orders').then(response => response.data.orders),
            
            // Fetch material inventory from supplier system
            axios.get('http://localhost:7002/api/supplier/material-inventory').then(response => response.data.materials)
        ]);
        
        // Calculate statistics
        const totalOrders = retailerOrders.length;
        const pendingOrders = retailerOrders.filter(order => order.status === 'Pending').length;
        const inProductionOrders = retailerOrders.filter(order => order.status === 'In Production').length;
        const shippedOrders = retailerOrders.filter(order => order.status === 'Shipped').length;
        const deliveredOrders = retailerOrders.filter(order => order.status === 'Delivered').length;
        
        // Get material statistics
        const materialStats = supplierMaterials.map(material => ({
            name: material.name,
            stock: material.stock,
            status: material.stock <= 20 ? 'Low' : (material.stock <= 50 ? 'Medium' : 'Good')
        }));
        
        // Prepare order history data (by month)
        const orderHistory = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Initialize with zeros
        months.forEach(month => {
            orderHistory[month] = 0;
        });
        
        // Count orders by month
        retailerOrders.forEach(order => {
            const date = new Date(order.createdAt);
            const month = months[date.getMonth()];
            orderHistory[month]++;
        });
        
        res.status(200).json({
            orderStats: {
                total: totalOrders,
                pending: pendingOrders,
                inProduction: inProductionOrders,
                shipped: shippedOrders,
                delivered: deliveredOrders
            },
            materialStats,
            orderHistory
        });
    } catch (error) {
        console.error('Error fetching system statistics:', error);
        res.status(500).json({ message: 'Error fetching system statistics', error: error.message });
    }
};

// Get detailed order analytics
exports.getOrderAnalytics = async (req, res) => {
    try {
        // Fetch orders from retailer system
        const retailerOrders = await axios.get('http://localhost:7001/api/retailer/orders')
            .then(response => response.data.orders);
        
        // Calculate order processing time (simulated)
        const processingStages = {
            orderToAcceptance: 1.2,
            acceptanceToProduction: 2.5,
            productionToShipping: 1.8,
            shippingToDelivery: 3.2
        };
        
        // Calculate material distribution
        const materialDistribution = {};
        
        retailerOrders.forEach(order => {
            if (!materialDistribution[order.productMaterial]) {
                materialDistribution[order.productMaterial] = 0;
            }
            materialDistribution[order.productMaterial]++;
        });
        
        // Calculate completion rate
        const completionRate = {
            total: retailerOrders.length,
            completed: retailerOrders.filter(order => order.status === 'Delivered').length,
            rate: retailerOrders.length > 0 ? 
                (retailerOrders.filter(order => order.status === 'Delivered').length / retailerOrders.length) * 100 : 0
        };
        
        res.status(200).json({
            processingTimes: processingStages,
            materialDistribution,
            completionRate
        });
    } catch (error) {
        console.error('Error fetching order analytics:', error);
        res.status(500).json({ message: 'Error fetching order analytics', error: error.message });
    }
};

// Get inventory analytics
exports.getInventoryAnalytics = async (req, res) => {
    try {
        // Fetch material inventory from supplier system
        const supplierMaterials = await axios.get('http://localhost:7002/api/supplier/material-inventory')
            .then(response => response.data.materials);
        
        // Simulate material usage data over the last 6 months
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        
        const materialUsage = supplierMaterials.map(material => ({
            name: material.name,
            monthlyUsage: months.map(() => Math.floor(Math.random() * 50) + 10),
            currentStock: material.stock,
            reorderLevel: 20
        }));
        
        res.status(200).json({
            materials: supplierMaterials,
            materialUsage
        });
    } catch (error) {
        console.error('Error fetching inventory analytics:', error);
        res.status(500).json({ message: 'Error fetching inventory analytics', error: error.message });
    }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
    try {
        // Simulate user statistics
        const userStats = {
            retailers: 15,
            suppliers: 8,
            manufacturers: 5,
            distributors: 3
        };
        
        res.status(200).json(userStats);
    } catch (error) {
        console.error('Error fetching user statistics:', error);
        res.status(500).json({ message: 'Error fetching user statistics', error: error.message });
    }
};