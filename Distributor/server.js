const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 7004;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/Sistema_Distributor', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to Distributor MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Import routes
const distributorRoutes = require('./routes/distributorRoutes');

// Use routes
app.use('/api/distributor', distributorRoutes);

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'distributor.html'));
});

app.listen(PORT, () => {
    console.log(`Distributor server running on port ${PORT}`);
});