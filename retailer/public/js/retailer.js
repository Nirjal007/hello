document.addEventListener('DOMContentLoaded', function() {
    // Set current date
    updateDateTime();
    
    // Initialize the order form
    initializeOrderForm();
    
    // Load orders for the retailer
    loadOrders();
    
    // Set up interval to refresh orders every 30 seconds
    setInterval(loadOrders, 30000);
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

// Initialize the order form
function initializeOrderForm() {
    const orderForm = document.getElementById('order-form');
    
    orderForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const retailerEmail = document.getElementById('retailer-email').value;
        const productName = document.getElementById('product-name').value;
        const productMaterial = document.getElementById('product-material').value;
        const quantity = document.getElementById('quantity').value;
        
        // Create the order data
        const orderData = {
            retailerEmail,
            productName,
            productMaterial,
            quantity: Number(quantity)
        };
        
        // Send the order to the server
        fetch('http://localhost:7001/api/retailer/place-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to place order');
            }
            return response.json();
        })
        .then(data => {
            alert('Order placed successfully!');
            orderForm.reset();
            loadOrders(); // Reload the orders list
        })
        .catch(error => {
            console.error('Error placing order:', error);
            alert('Error placing order: ' + error.message);
        });
    });
}

// Load orders for the current retailer
function loadOrders() {
    const retailerEmail = document.getElementById('retailer-email').value;
    
    if (!retailerEmail) {
        // If no email is entered, we'll fetch all orders instead of filtering by email
        console.log("No email entered, showing all orders");
        
        fetch(`http://localhost:7001/api/retailer/orders`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch orders');
                }
                return response.json();
            })
            .then(data => {
                console.log("Orders received:", data);
                if (!data.orders || data.orders.length === 0) {
                    document.getElementById('orders-table-body').innerHTML = `
                        <tr><td colspan="6">No orders found. Place an order to get started.</td></tr>
                    `;
                    updateOrderCounts(0, 0, 0);
                    return;
                }
                
                // Update the orders table
                updateOrdersTable(data.orders);
                
                // Update the order counts
                const pendingCount = data.orders.filter(order => ['Pending'].includes(order.status)).length;
                const inProgressCount = data.orders.filter(order => ['Accepted', 'In Production', 'Shipped'].includes(order.status)).length;
                const completedCount = data.orders.filter(order => ['Delivered'].includes(order.status)).length;
                
                updateOrderCounts(pendingCount, inProgressCount, completedCount);
            })
            .catch(error => {
                console.error('Error loading orders:', error);
                document.getElementById('orders-table-body').innerHTML = `
                    <tr><td colspan="6">Error loading orders. Please try again.</td></tr>
                `;
            });
    } else {
        // If email is entered, fetch orders for that email
        fetch(`http://localhost:7001/api/retailer/orders/${retailerEmail}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch orders');
                }
                return response.json();
            })
            .then(data => {
                console.log("Orders received for email:", data);
                if (!data.orders || data.orders.length === 0) {
                    document.getElementById('orders-table-body').innerHTML = `
                        <tr><td colspan="6">No orders found. Place an order to get started.</td></tr>
                    `;
                    updateOrderCounts(0, 0, 0);
                    return;
                }
                
                // Update the orders table
                updateOrdersTable(data.orders);
                
                // Update the order counts
                const pendingCount = data.orders.filter(order => ['Pending'].includes(order.status)).length;
                const inProgressCount = data.orders.filter(order => ['Accepted', 'In Production', 'Shipped'].includes(order.status)).length;
                const completedCount = data.orders.filter(order => ['Delivered'].includes(order.status)).length;
                
                updateOrderCounts(pendingCount, inProgressCount, completedCount);
            })
            .catch(error => {
                console.error('Error loading orders:', error);
                document.getElementById('orders-table-body').innerHTML = `
                    <tr><td colspan="6">Error loading orders. Please try again.</td></tr>
                `;
            });
    }
}

// Update the orders table with new data
function updateOrdersTable(orders) {
    const tableBody = document.getElementById('orders-table-body');
    tableBody.innerHTML = '';
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        
        const orderDate = new Date(order.createdAt).toLocaleDateString();
        
        row.innerHTML = `
            <td>${order._id}</td>
            <td>${order.productName}</td>
            <td>${order.productMaterial}</td>
            <td>${order.quantity}</td>
            <td><span class="status status-${order.status.toLowerCase()}">${order.status}</span></td>
            <td>${orderDate}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Update the order count displays
function updateOrderCounts(pending, inProgress, completed) {
    document.getElementById('pending-count').textContent = pending;
    document.getElementById('inprogress-count').textContent = inProgress;
    document.getElementById('completed-count').textContent = completed;
}