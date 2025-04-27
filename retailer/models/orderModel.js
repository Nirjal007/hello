const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
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
        enum: ['Pending', 'Accepted', 'Rejected', 'In Production', 'Shipped', 'Delivered'],
        default: 'Pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);