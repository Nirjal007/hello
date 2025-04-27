document.addEventListener('DOMContentLoaded', function() {
    // Set current date
    updateDateTime();
    
    // Load new orders
    fetchNewOrders();
    
    // Load orders in production
    fetchOrdersInProduction();
    
    // Set up modal event listeners
    setupModalEvents();
    
    // Set up interval to refresh data every 30 seconds
    setInterval(() => {
        fetchNewOrders();
        fetchOrdersInProduction();
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

// Fetch new orders (status: Accepted)
function fetchNewOrders() {
    fetch('http://localhost:7003/api/manufacturer/new-orders')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch new orders');
            }
            return response.json();
        })
        .then(data => {
            console.log('New orders data:', data);
            
            if (!data.orders || data.orders.length === 0) {
                document.getElementById('new-orders-table').innerHTML = `
                    <tr><td colspan="6">No new orders at the moment.</td></tr>
                `;
                document.getElementById('new-count').textContent = '0';
                return;
            }
            
            const newOrdersTable = document.getElementById('new-orders-table');
            newOrdersTable.innerHTML = '';
            
            data.orders.forEach(order => {
                const row = document.createElement('tr');
                const receivedDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A';
                
                row.innerHTML = `
                    <td>${order._id}</td>
                    <td>${order.productName}</td>
                    <td>${order.productMaterial}</td>
                    <td>${order.quantity}</td>
                    <td>${receivedDate}</td>
                    <td>
                        <button class="btn-primary create-product-btn" data-order-id="${order._id}">Create Product</button>
                    </td>
                `;
                
                newOrdersTable.appendChild(row);
            });
            
            // Update count
            document.getElementById('new-count').textContent = data.orders.length;
            
            // Add event listeners to Create Product buttons
            document.querySelectorAll('.create-product-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const orderId = this.getAttribute('data-order-id');
                    const order = data.orders.find(o => o._id === orderId);
                    if (order) {
                        openCreateProductModal(order);
                    }
                });
            });
        })
        .catch(error => {
            console.error('Error fetching new orders:', error);
            document.getElementById('new-orders-table').innerHTML = `
                <tr><td colspan="6">Error loading orders: ${error.message}</td></tr>
            `;
        });
}

// Fetch orders in production
function fetchOrdersInProduction() {
    fetch('http://localhost:7003/api/manufacturer/orders-in-production')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch orders in production');
            }
            return response.json();
        })
        .then(data => {
            console.log('Orders in production data:', data);
            
            if (!data.orders || data.orders.length === 0) {
                document.getElementById('in-progress-table').innerHTML = `
                    <tr><td colspan="9">No orders in production at the moment.</td></tr>
                `;
                document.getElementById('production-count').textContent = '0';
                return;
            }
            
            const inProgressTable = document.getElementById('in-progress-table');
            inProgressTable.innerHTML = '';
            
            data.orders.forEach(order => {
                const row = document.createElement('tr');
                const manufacturedDate = order.manufacturedDate ? new Date(order.manufacturedDate).toLocaleDateString() : 'N/A';
                
                row.innerHTML = `
                    <td>${order._id}</td>
                    <td>${order.productName}</td>
                    <td>${order.productId}</td>
                    <td>${order.productMaterial}</td>
                    <td>${order.brand}</td>
                    <td>${order.color}</td>
                    <td>${order.manufacturedLocation}</td>
                    <td>${manufacturedDate}</td>
                    <td>
                        <button class="btn-success complete-btn" data-order-id="${order._id}">Complete</button>
                    </td>
                `;
                
                inProgressTable.appendChild(row);
            });
            
            // Update count
            document.getElementById('production-count').textContent = data.orders.length;
            
            // Add event listeners to Complete buttons
            document.querySelectorAll('.complete-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const orderId = this.getAttribute('data-order-id');
                    completeProduction(orderId);
                });
            });
        })
        .catch(error => {
            console.error('Error fetching orders in production:', error);
            document.getElementById('in-progress-table').innerHTML = `
                <tr><td colspan="9">Error loading orders: ${error.message}</td></tr>
            `;
        });
    
    // Also fetch completed orders for the count
    fetch('http://localhost:7003/api/manufacturer/completed-orders')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch completed orders');
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('completed-count').textContent = data.orders ? data.orders.length : '0';
        })
        .catch(error => {
            console.error('Error fetching completed orders:', error);
        });
}

// Open modal for creating a new product
function openCreateProductModal(order) {
    console.log('Opening create product modal for order:', order);
    
    const modal = document.getElementById('order-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDetails = document.getElementById('modal-order-details');
    const startProductionButton = document.getElementById('start-production-button');
    
    modalTitle.textContent = `Create Product for Order: ${order.productName}`;
    modal.dataset.orderId = order._id;
    
    // Format the order details for display
    modalDetails.innerHTML = `
        <div><strong>Order ID:</strong> ${order._id}</div>
        <div><strong>Product:</strong> ${order.productName}</div>
        <div><strong>Material:</strong> ${order.productMaterial}</div>
        <div><strong>Quantity:</strong> ${order.quantity}</div>
        <div><strong>Status:</strong> ${order.status}</div>
        <div><strong>Retailer:</strong> ${order.retailerEmail}</div>
    `;
    
    // Make sure today's date is set as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('manufactured-date').value = today;
    
    // Change button text to "Create Product"
    startProductionButton.textContent = "Create Product";
    
    modal.style.display = 'flex';
}

// Set up modal event listeners
function setupModalEvents() {
    const modal = document.getElementById('order-modal');
    const closeButton = document.querySelector('.close-modal');
    const startProductionButton = document.getElementById('start-production-button');
    
    // Close modal when clicking the X (Close button)
    closeButton.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Close modal when clicking outside of the modal
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Create product button
    startProductionButton.addEventListener('click', function() {
        const orderId = modal.dataset.orderId;
        
        if (!orderId) {
            console.error("No order ID found in modal");
            return;
        }
        
        createProduct(orderId);
    });
}

// Create a new product
function createProduct(orderId) {
    // Get form field values
    const productId = document.getElementById('product-id').value;
    const brand = document.getElementById('brand').value;
    const color = document.getElementById('color').value;
    const manufacturedLocation = document.getElementById('manufactured-location').value;
    const manufacturedDate = document.getElementById('manufactured-date').value;
    
    // Validate form fields
    if (!productId || !brand || !color || !manufacturedLocation || !manufacturedDate) {
        alert('Please fill in all required fields.');
        return;
    }
    
    console.log('Creating product for order:', orderId);
    
    fetch('http://localhost:7003/api/manufacturer/create-product', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            orderId,
            productId,
            brand,
            color,
            manufacturedLocation,
            manufacturedDate
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to create product');
        }
        return response.json();
    })
    .then(data => {
        console.log('Product created successfully:', data);
        
        // Close modal and show success message
        document.getElementById('order-modal').style.display = 'none';
        alert('Product created successfully and moved to production.');
        
        // Refresh the orders
        fetchNewOrders();
        fetchOrdersInProduction();
    })
    .catch(error => {
        console.error('Error creating product:', error);
        alert('Error creating product: ' + error.message);
    });
}

// Complete production for an order
function completeProduction(orderId) {
    if (!confirm('Are you sure you want to mark this production as complete?')) {
        return;
    }
    
    console.log('Completing production for order:', orderId);
    
    fetch('http://localhost:7003/api/manufacturer/complete-production', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            orderId
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to complete production');
        }
        return response.json();
    })
    .then(data => {
        console.log('Production completed successfully:', data);
        alert('Production completed successfully and forwarded to distributor.');
        
        // Refresh the orders
        fetchNewOrders();
        fetchOrdersInProduction();
    })
    .catch(error => {
        console.error('Error completing production:', error);
        alert('Error completing production: ' + error.message);
    });
}