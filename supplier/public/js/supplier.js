document.addEventListener('DOMContentLoaded', function() {
    // Set current date
    updateDateTime();
    
    // Load material inventory
    loadMaterialInventory();
    
    // Load pending orders
    loadPendingOrders();
    
    // Load orders in production
    loadOrdersInProduction();
    
    // Set up modal event listeners
    setupModalEvents();
    
    // Set up interval to refresh data every 30 seconds
    setInterval(() => {
        loadMaterialInventory();
        loadPendingOrders();
        loadOrdersInProduction();
    }, 30000);
});

// Update the displayed date and time
function updateDateTime() {
    const dateElement = document.getElementById('current-date');
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    dateElement.textContent = now.toLocaleDateString('en-US', options);
}

// Load material inventory
function loadMaterialInventory() {
    fetch('http://localhost:7002/api/supplier/material-inventory')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch material inventory');
            }
            return response.json();
        })
        .then(data => {
            if (!data.materials || data.materials.length === 0) {
                document.getElementById('materials-container').innerHTML = `
                    <p>No materials found.</p>
                `;
                return;
            }
            
            const materialsContainer = document.getElementById('materials-container');
            materialsContainer.innerHTML = '';
            
            data.materials.forEach(material => {
                // Determine stock level
                let stockLevel = 'high';
                if (material.stock <= 30) {
                    stockLevel = 'low';
                } else if (material.stock <= 70) {
                    stockLevel = 'medium';
                }
                
                // Calculate percentage for the stock bar
                const percentage = Math.min(100, (material.stock / 200) * 100);
                
                const materialCard = document.createElement('div');
                materialCard.className = 'material-card';
                materialCard.innerHTML = `
                    <div class="material-name">${material.name}</div>
                    <div class="stock-bar">
                        <div class="stock-level ${stockLevel}" style="width: ${percentage}%"></div>
                    </div>
                    <div class="stock-info">
                        <span>Stock:</span>
                        <span>${material.stock} units</span>
                    </div>
                    <button class="update-stock-btn" data-material-id="${material._id}" data-material-name="${material.name}" data-material-stock="${material.stock}">
                        Update Stock
                    </button>
                `;
                
                materialsContainer.appendChild(materialCard);
                
                // Add event listener to the update stock button
                const updateBtn = materialCard.querySelector('.update-stock-btn');
                updateBtn.addEventListener('click', function() {
                    openMaterialModal(
                        this.getAttribute('data-material-id'),
                        this.getAttribute('data-material-name'),
                        this.getAttribute('data-material-stock')
                    );
                });
            });
        })
        .catch(error => {
            console.error('Error loading material inventory:', error);
            document.getElementById('materials-container').innerHTML = `
                <p>Error loading materials: ${error.message}</p>
            `;
        });
}

// Load pending orders
function loadPendingOrders() {
    fetch('http://localhost:7002/api/supplier/pending-orders')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch pending orders');
            }
            return response.json();
        })
        .then(data => {
            // Filter to get only pending orders
            const pendingOrders = data.orders.filter(order => order.status === 'Pending');
            
            if (pendingOrders.length === 0) {
                document.getElementById('pending-orders-table').innerHTML = `
                    <tr><td colspan="7">No pending orders at the moment.</td></tr>
                `;
                document.getElementById('pending-count').textContent = '0';
                return;
            }
            
            const pendingOrdersTable = document.getElementById('pending-orders-table');
            pendingOrdersTable.innerHTML = '';
            
            pendingOrders.forEach(order => {
                const row = document.createElement('tr');
                
                const orderDate = new Date(order.createdAt).toLocaleDateString();
                
                row.innerHTML = `
                    <td>${order._id}</td>
                    <td>${order.retailerEmail}</td>
                    <td>${order.productName}</td>
                    <td>${order.productMaterial}</td>
                    <td>${order.quantity}</td>
                    <td>${orderDate}</td>
                    <td>
                        <button class="btn-info view-order-btn" data-order-id="${order._id}">View</button>
                    </td>
                `;
                
                pendingOrdersTable.appendChild(row);
                
                // Add event listener to the view button
                const viewBtn = row.querySelector('.view-order-btn');
                viewBtn.addEventListener('click', function() {
                    const orderId = this.getAttribute('data-order-id');
                    const orderObj = pendingOrders.find(o => o._id === orderId);
                    if (orderObj) {
                        openOrderModal(orderObj);
                    }
                });
            });
            
            // Update count
            document.getElementById('pending-count').textContent = pendingOrders.length;
        })
        .catch(error => {
            console.error('Error loading pending orders:', error);
            document.getElementById('pending-orders-table').innerHTML = `
                <tr><td colspan="7">Error loading orders: ${error.message}</td></tr>
            `;
        });
}

// Load orders in production
function loadOrdersInProduction() {
    fetch('http://localhost:7002/api/supplier/pending-orders')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch orders in production');
            }
            return response.json();
        })
        .then(data => {
            // Filter to get accepted and in production orders
            const productionOrders = data.orders.filter(order => 
                order.status === 'Accepted' || order.status === 'In Production'
            );
            
            if (productionOrders.length === 0) {
                document.getElementById('production-orders-table').innerHTML = `
                    <tr><td colspan="7">No orders in production at the moment.</td></tr>
                `;
                document.getElementById('accepted-count').textContent = '0';
                document.getElementById('inproduction-count').textContent = '0';
                return;
            }
            
            const productionOrdersTable = document.getElementById('production-orders-table');
            productionOrdersTable.innerHTML = '';
            
            productionOrders.forEach(order => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${order._id}</td>
                    <td>${order.retailerEmail}</td>
                    <td>${order.productName}</td>
                    <td>${order.productMaterial}</td>
                    <td>${order.quantity}</td>
                    <td><span class="status status-${order.status.toLowerCase()}">${order.status}</span></td>
                    <td>${order.manufacturerId || 'Not assigned'}</td>
                `;
                
                productionOrdersTable.appendChild(row);
            });
            
            // Update counts
            const acceptedCount = productionOrders.filter(order => order.status === 'Accepted').length;
            const inProductionCount = productionOrders.filter(order => order.status === 'In Production').length;
            
            document.getElementById('accepted-count').textContent = acceptedCount;
            document.getElementById('inproduction-count').textContent = inProductionCount;
        })
        .catch(error => {
            console.error('Error loading orders in production:', error);
            document.getElementById('production-orders-table').innerHTML = `
                <tr><td colspan="7">Error loading orders: ${error.message}</td></tr>
            `;
        });
}

// Open the order modal
function openOrderModal(order) {
    const modal = document.getElementById('order-modal');
    const modalTitle = document.getElementById('modal-title');
    const orderDetails = document.getElementById('modal-order-details');
    const acceptBtn = document.getElementById('accept-order-btn');
    const rejectBtn = document.getElementById('reject-order-btn');
    
    modalTitle.textContent = `Order: ${order._id}`;
    
    orderDetails.innerHTML = `
        <div><strong>Retailer:</strong> ${order.retailerEmail}</div>
        <div><strong>Product:</strong> ${order.productName}</div>
        <div><strong>Material:</strong> ${order.productMaterial}</div>
        <div><strong>Quantity:</strong> ${order.quantity}</div>
        <div><strong>Status:</strong> ${order.status}</div>
        <div><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</div>
    `;
    
   // Set up accept button
acceptBtn.onclick = function() {
    // First update the order status
    fetch('http://localhost:7002/api/supplier/update-order-status', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            orderId: order._id,
            status: 'Accepted'
        })
    })
    .then(response => {
        if (!response.ok) {
            // If the response is not ok, throw an error
            return response.json().then(errorData => {
                throw new Error(errorData.message || 'Failed to accept order');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Order accepted:', data);
        modal.style.display = 'none';

        // Then open the forward modal
        openForwardModal(data.order);
    })
    .catch(error => {
        console.error('Error accepting order:', error);
        
        // Check if the error message indicates insufficient inventory
        if (error.message.includes('Insufficient inventory')) {
            alert('Error accepting order: Due to insufficient inventory, the order could not be accepted.');
        } else {
            // If it's another error, show the generic error message
            alert('Error accepting order: ' + error.message);
        }
    });
};

    
    // Set up reject button
    rejectBtn.onclick = function() {
        if (confirm('Are you sure you want to reject this order?')) {
            fetch('http://localhost:7002/api/supplier/update-order-status', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderId: order._id,
                    status: 'Rejected'
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to reject order');
                }
                return response.json();
            })
            .then(data => {
                console.log('Order rejected:', data);
                modal.style.display = 'none';
                alert('Order rejected successfully.');
                loadPendingOrders();
            })
            .catch(error => {
                console.error('Error rejecting order:', error);
                alert('Error rejecting order: ' + error.message);
            });
        }
    };
    
    modal.style.display = 'flex';
}

// Open the forward to manufacturer modal
function openForwardModal(order) {
    const modal = document.getElementById('forward-modal');
    const orderDetails = document.getElementById('forward-order-details');
    const forwardBtn = document.getElementById('forward-order-btn');
    
    orderDetails.innerHTML = `
        <div><strong>Order ID:</strong> ${order._id}</div>
        <div><strong>Retailer:</strong> ${order.retailerEmail}</div>
        <div><strong>Product:</strong> ${order.productName}</div>
        <div><strong>Material:</strong> ${order.productMaterial}</div>
        <div><strong>Quantity:</strong> ${order.quantity}</div>
    `;
    
    // Set up forward button
    forwardBtn.onclick = function() {
        const manufacturerId = document.getElementById('manufacturer-id').value;
        
        if (!manufacturerId) {
            alert('Please enter a manufacturer ID');
            return;
        }
        
        fetch('http://localhost:7002/api/supplier/forward-to-manufacturer', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderId: order._id,
                manufacturerId
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to forward order to manufacturer');
            }
            return response.json();
        })
        .then(data => {
            console.log('Order forwarded to manufacturer:', data);
            modal.style.display = 'none';
            alert('Order forwarded to manufacturer successfully.');
            loadPendingOrders();
            loadOrdersInProduction();
        })
        .catch(error => {
            console.error('Error forwarding order to manufacturer:', error);
            alert('Error forwarding order: ' + error.message);
        });
    };
    
    modal.style.display = 'flex';
}

// Open the material update modal
function openMaterialModal(materialId, materialName, currentStock) {
    const modal = document.getElementById('material-modal');
    const modalTitle = document.getElementById('material-modal-title');
    const stockInput = document.getElementById('material-stock');
    const updateBtn = document.getElementById('update-material-btn');
    
    modalTitle.textContent = `Update Stock: ${materialName}`;
    stockInput.value = currentStock;
    
    // Set up update button
    updateBtn.onclick = function() {
        const stock = parseInt(stockInput.value);
        
        if (isNaN(stock) || stock < 0) {
            alert('Please enter a valid stock quantity');
            return;
        }
        
        fetch('http://localhost:7002/api/supplier/update-material-stock', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                materialId,
                stock
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update material stock');
            }
            return response.json();
        })
        .then(data => {
            console.log('Material stock updated:', data);
            modal.style.display = 'none';
            alert('Material stock updated successfully.');
            loadMaterialInventory();
        })
        .catch(error => {
            console.error('Error updating material stock:', error);
            alert('Error updating material stock: ' + error.message);
        });
    };
    
    modal.style.display = 'flex';
}

// Set up modal event listeners
function setupModalEvents() {
    // Get all modals
    const modals = [
        document.getElementById('order-modal'),
        document.getElementById('forward-modal'),
        document.getElementById('material-modal')
    ];
    
    // Get all close buttons
    const closeButtons = document.querySelectorAll('.close-modal');
    
    // Add click event to all close buttons
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            modals.forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}