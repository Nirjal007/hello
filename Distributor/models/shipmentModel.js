const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
    manufacturerOrderId: {
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
    productId: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Shipped', 'Delivered'],
        default: 'Pending'
    },
    trackingNumber: {
        type: String,
        default: null
    },
    shippingMethod: {
        type: String,
        default: null
    },
    estimatedDelivery: {
        type: Date,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Shipment', shipmentSchema);