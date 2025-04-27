// Add to your existing server.js file
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

// Also add a route to serve the admin HTML page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});