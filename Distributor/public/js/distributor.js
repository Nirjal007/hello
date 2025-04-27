document.addEventListener('DOMContentLoaded', function() {
    // Define API URL at the top
    window.API_URL = 'http://localhost:7004/api/distributor';
    
    // Set current date
    updateDateTime();
    
    // Load shipment data
    loadAllShipmentData();
    
    // Set up event listeners
    setupEventListeners();
});

// Load all shipment data
function loadAllShipmentData() {
    loadPendingShipments();
    loadShippedShipments();
    loadDeliveredShipments();
    updateShipmentCounters();
}

// Set up event listeners including those for dynamic elements
function setupEventListeners() {
    // Event listener for the modal close button
    const closeButton = document.querySelector('.close-modal');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            document.getElementById('shipment-modal').style.display = 'none';
        });
    }
    
    // Event listener for the save button in the modal
    const saveButton = document.getElementById('save-shipment');
    if (saveButton) {
        saveButton.addEventListener('click', function() {
            const shipmentId = this.getAttribute('data-shipment-id');
            const shippingMethod = document.getElementById('shipping-method').value;
            const estimatedDelivery = document.getElementById('estimated-delivery').value;
            
            if (!shippingMethod || !estimatedDelivery) {
                alert('Please fill in all required fields');
                return;
            }
            
            processShipment(shipmentId, shippingMethod, estimatedDelivery);
        });
    }
    
    // Event delegation for dynamically created elements (like process buttons)
    document.addEventListener('click', function(event) {
        // Handle process button clicks
        if (event.target.classList.contains('process-btn')) {
            const shipmentId = event.target.getAttribute('data-shipment-id');
            console.log('Process button clicked for shipment ID:', shipmentId);
            
            // Fetch shipment details and open modal
            fetch(`${API_URL}/pending-shipments`)
                .then(response => response.json())
                .then(data => {
                    const shipment = data.shipments.find(s => s._id === shipmentId);
                    if (shipment) {
                        openShipmentModal(shipment);
                    } else {
                        alert('Could not find shipment details');
                    }
                })
                .catch(error => {
                    console.error('Error fetching shipment details:', error);
                    alert('Error fetching shipment details');
                });
        }
        
        // Handle deliver button clicks
        if (event.target.classList.contains('deliver-btn')) {
            const shipmentId = event.target.getAttribute('data-id');
            markAsDelivered(shipmentId);
        }
        
        // Handle outside modal clicks
        if (event.target.id === 'shipment-modal') {
            document.getElementById('shipment-modal').style.display = 'none';
        }
    });
}

// Update the displayed date and time
function updateDateTime() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        dateElement.textContent = now.toLocaleDateString('en-US', options);
    }
}

// Update shipment counters
function updateShipmentCounters() {
    fetch(`${API_URL}/pending-shipments`)
        .then(response => response.json())
        .then(data => {
            const shipments = data.shipments || [];
            const pendingCounter = document.getElementById('pending-count');
            if (pendingCounter) pendingCounter.textContent = shipments.length;
        })
        .catch(error => console.error('Error fetching pending count:', error));
    
    fetch(`${API_URL}/shipped-shipments`)
        .then(response => response.json())
        .then(data => {
            const shipments = data.shipments || [];
            const inTransitCounter = document.getElementById('in-transit-count');
            if (inTransitCounter) inTransitCounter.textContent = shipments.length;
        })
        .catch(error => console.error('Error fetching in-transit count:', error));
    
    fetch(`${API_URL}/delivered-shipments`)
        .then(response => response.json())
        .then(data => {
            const shipments = data.shipments || [];
            const deliveredCounter = document.getElementById('delivered-count');
            if (deliveredCounter) deliveredCounter.textContent = shipments.length;
        })
        .catch(error => console.error('Error fetching delivered count:', error));
}

// Load pending shipments
function loadPendingShipments() {
    const pendingShipmentsTable = document.getElementById('pending-shipments-table');
    if (!pendingShipmentsTable) {
        console.error('Could not find pending-shipments-table element');
        return;
    }
    
    fetch(`${API_URL}/pending-shipments`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch pending shipments');
            }
            return response.json();
        })
        .then(data => {
            console.log('Pending shipments data:', data);
            
            pendingShipmentsTable.innerHTML = '';
            
            if (!data.shipments || data.shipments.length === 0) {
                pendingShipmentsTable.innerHTML = `
                    <tr><td colspan="7">No pending shipments at the moment.</td></tr>
                `;
                const pendingCounter = document.getElementById('pending-count');
                if (pendingCounter) pendingCounter.textContent = '0';
                return;
            }
            
            data.shipments.forEach(shipment => {
                const row = document.createElement('tr');
                const receivedDate = shipment.createdAt ? new Date(shipment.createdAt).toLocaleDateString() : 'N/A';
                
                row.innerHTML = `
                    <td>${shipment._id}</td>
                    <td>${shipment.retailerEmail}</td>
                    <td>${shipment.productName}</td>
                    <td>${shipment.productId || 'N/A'}</td>
                    <td>${shipment.quantity}</td>
                    <td>${receivedDate}</td>
                    <td>
                        <button class="btn-primary process-btn" data-shipment-id="${shipment._id}">Process</button>
                    </td>
                `;
                
                pendingShipmentsTable.appendChild(row);
            });
            
            // Update count
            const pendingCounter = document.getElementById('pending-count');
            if (pendingCounter) pendingCounter.textContent = data.shipments.length;
        })
        .catch(error => {
            console.error('Error fetching pending shipments:', error);
            pendingShipmentsTable.innerHTML = `
                <tr><td colspan="7">Error loading shipments. Please check your connection.</td></tr>
            `;
        });
}

// Load shipped shipments (in transit)
function loadShippedShipments() {
    const inTransitShipmentsTable = document.getElementById('in-transit-shipments-table');
    
    if (!inTransitShipmentsTable) {
        console.error('Could not find in-transit-shipments-table element');
        return;
    }
    
    fetch(`${API_URL}/shipped-shipments`)
        .then(response => response.json())
        .then(data => {
            console.log('Shipped shipments data:', data);
            
            inTransitShipmentsTable.innerHTML = '';
            
            if (!data.shipments || data.shipments.length === 0) {
                inTransitShipmentsTable.innerHTML = `
                    <tr><td colspan="8">No shipments in transit at the moment.</td></tr>
                `;
                const inTransitCounter = document.getElementById('in-transit-count');
                if (inTransitCounter) inTransitCounter.textContent = '0';
                return;
            }
            
            data.shipments.forEach(shipment => {
                const row = document.createElement('tr');
                const shipDate = shipment.shipDate ? new Date(shipment.shipDate).toLocaleDateString() : 'N/A';
                const estDelivery = shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleDateString() : 'N/A';
                
                row.innerHTML = `
                    <td>${shipment._id}</td>
                    <td>${shipment.trackingNumber || 'N/A'}</td>
                    <td>${shipment.retailerEmail}</td>
                    <td>${shipment.productName}</td>
                    <td>${shipment.shippingMethod || 'Standard'}</td>
                    <td>${shipDate}</td>
                    <td>${estDelivery}</td>
                    <td>
                        <button class="btn-success deliver-btn" data-id="${shipment._id}">Mark Delivered</button>
                    </td>
                `;
                
                inTransitShipmentsTable.appendChild(row);
            });
            
            // Update count
            const inTransitCounter = document.getElementById('in-transit-count');
            if (inTransitCounter) inTransitCounter.textContent = data.shipments.length;
        })
        .catch(error => {
            console.error('Error loading shipped shipments:', error);
            inTransitShipmentsTable.innerHTML = `
                <tr><td colspan="8">Error loading shipments. Please check your connection.</td></tr>
            `;
        });
}

// Load delivered shipments
function loadDeliveredShipments() {
    const deliveredShipmentsTable = document.getElementById('delivered-shipments-table');
    
    if (!deliveredShipmentsTable) {
        console.error('Could not find delivered-shipments-table element');
        return;
    }
    
    fetch(`${API_URL}/delivered-shipments`)
        .then(response => response.json())
        .then(data => {
            console.log('Delivered shipments data:', data);
            
            deliveredShipmentsTable.innerHTML = '';
            
            if (!data.shipments || data.shipments.length === 0) {
                deliveredShipmentsTable.innerHTML = `
                    <tr><td colspan="6">No delivered shipments at the moment.</td></tr>
                `;
                const deliveredCounter = document.getElementById('delivered-count');
                if (deliveredCounter) deliveredCounter.textContent = '0';
                return;
            }
            
            data.shipments.forEach(shipment => {
                const row = document.createElement('tr');
                const deliveryDate = shipment.updatedAt ? new Date(shipment.updatedAt).toLocaleDateString() : 'N/A';
                
                row.innerHTML = `
                    <td>${shipment._id}</td>
                    <td>${shipment.trackingNumber || 'N/A'}</td>
                    <td>${shipment.retailerEmail}</td>
                    <td>${shipment.productName}</td>
                    <td>${shipment.quantity}</td>
                    <td>${deliveryDate}</td>
                `;
                
                deliveredShipmentsTable.appendChild(row);
            });
            
            // Update count
            const deliveredCounter = document.getElementById('delivered-count');
            if (deliveredCounter) deliveredCounter.textContent = data.shipments.length;
        })
        .catch(error => {
            console.error('Error loading delivered shipments:', error);
            deliveredShipmentsTable.innerHTML = `
                <tr><td colspan="6">Error loading shipments. Please check your connection.</td></tr>
            `;
        });
}

// Open shipment modal
function openShipmentModal(shipment) {
    console.log('Opening modal for shipment:', shipment);
    const modal = document.getElementById('shipment-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDetails = document.getElementById('modal-shipment-details');
    const saveButton = document.getElementById('save-shipment');
    
    // Store shipment ID in save button
    saveButton.setAttribute('data-shipment-id', shipment._id);
    
    // Set modal title
    modalTitle.textContent = `Process Shipment: ${shipment.productName}`;
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Get estimated delivery date (7 days from now)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);
    const estimatedDeliveryStr = estimatedDelivery.toISOString().split('T')[0];
    
    // Set modal content
    modalDetails.innerHTML = `
        <div><strong>Shipment ID:</strong> ${shipment._id}</div>
        <div><strong>Retailer:</strong> ${shipment.retailerEmail}</div>
        <div><strong>Product:</strong> ${shipment.productName}</div>
        <div><strong>Quantity:</strong> ${shipment.quantity}</div>
        
        <div class="form-group mt-3">
            <label for="shipping-method">Shipping Method:</label>
            <select id="shipping-method" class="form-control">
                <option value="">Select a Shipping Method</option>
                <option value="Standard">Standard</option>
                <option value="Express">Express</option>
                <option value="Priority">Priority</option>
            </select>
        </div>
        
        <div class="form-group mt-3">
            <label for="estimated-delivery">Estimated Delivery Date:</label>
            <input type="date" id="estimated-delivery" class="form-control" value="${estimatedDeliveryStr}">
        </div>
    `;
    
    // Display the modal
    modal.style.display = 'block';
}

// Process the shipment
function processShipment(shipmentId, shippingMethod, estimatedDelivery) {
    console.log('Processing shipment:', { shipmentId, shippingMethod, estimatedDelivery });
    
    const trackingNumber = 'TRK' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    const shipDate = new Date().toISOString().split('T')[0];
    
    fetch(`${API_URL}/process-shipment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            shipmentId: shipmentId,
            trackingNumber: trackingNumber,
            shippingMethod: shippingMethod,
            shipDate: shipDate,
            estimatedDelivery: estimatedDelivery
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.message || 'Failed to process shipment');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Shipment processed successfully:', data);
        
        // Close the modal
        document.getElementById('shipment-modal').style.display = 'none';
        
        // Refresh shipment data
        loadAllShipmentData();
        
        // Show success message
        alert('Shipment processed successfully! Tracking number: ' + trackingNumber);
    })
    .catch(error => {
        console.error('Error processing shipment:', error);
        alert('Error processing shipment: ' + error.message);
    });
}

// Mark shipment as delivered
function markAsDelivered(shipmentId) {
    if (!confirm('Are you sure you want to mark this shipment as delivered?')) return;
    
    fetch(`${API_URL}/mark-as-delivered`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ shipmentId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message && data.message.includes('delivered')) {
            alert('Shipment marked as delivered!');
            loadAllShipmentData();
        } else {
            alert('Error: ' + (data.message || 'Failed to mark shipment as delivered'));
        }
    })
    .catch(error => {
        console.error('Error marking shipment as delivered:', error);
        alert('Failed to mark shipment as delivered. Please try again.');
    });
}