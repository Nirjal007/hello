// models/userModel.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Admin', 'Supplier', 'Manufacturer', 'Distributor', 'Retailer'],
    required: true
  },
  companyName: {
    type: String,
    default: ''
  },
  storeName: {
    type: String,
    default: ''
  },
  contactNumber: {
    type: String,
    required: true
  },
  requires2FA: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);