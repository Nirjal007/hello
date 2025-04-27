// supplier/models/orderModel.js
const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    stock: {
        type: Number,
        required: true,
        default: 100
    }
});

const orderSchema = new mongoose.Schema({
    originalOrderId: {
        type: String,
        required: true
    },
    retailerEmail: {
        type: String,
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    productMaterial: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected', 'In Production', 'Production Completed', 'Shipped', 'Delivered'],
        default: 'Pending'
    },
    manufacturerId: {
        type: String,
        default: null
    },
    productId: String,
    brand: String,
    color: String,
    manufacturedLocation: String,
    manufacturedDate: Date
}, { timestamps: true });

// Material model for inventory tracking
const Material = mongoose.model('Material', materialSchema);

// Order model
const Order = mongoose.model('Order', orderSchema);

module.exports = { Order, Material };