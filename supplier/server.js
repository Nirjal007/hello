const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 7002;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const { initializeMaterialInventory } = require('./controllers/supplierController');

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/Sistema_Retailer')

.then(() => console.log('Connected to Supplier MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Import routes
const supplierRoutes = require('./routes/supplierRoutes');

// Use routes
app.use('/api/supplier', supplierRoutes);

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'supplier.html'));
});

app.listen(PORT, () => {
    console.log(`Supplier server running on port ${PORT}`);
});