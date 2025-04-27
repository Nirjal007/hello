const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    supplierOrderId: {
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
        enum: ['Accepted', 'In Production', 'Production Completed', 'Shipped'],
        default: 'Accepted'
    },
    productId: {
        type: String,
        default: null
    },
    brand: {
        type: String,
        default: null
    },
    color: {
        type: String,
        default: null
    },
    manufacturedLocation: {
        type: String,
        default: null
    },
    manufacturedDate: {
        type: Date,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);