document.addEventListener('DOMContentLoaded', function() {
    // Set current date
    updateDateTime();
    
    // Initialize navigation
    initNavigation();
    
    // Load data and initialize charts
    loadDashboardData();
    loadOrdersData();
    loadInventoryData();
    loadAdvancedAnalytics();
    loadUserData();
    
    // Setup filter events
    document.getElementById('apply-filters').addEventListener('click', function() {
        loadOrdersData();
    });
    
    // Setup modal close events
    setupModalEvents();
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

// Initialize section navigation
function initNavigation() {
    // Initially show only the overview section
    document.querySelectorAll('.dashboard-section').forEach(section => {
        if (section.id !== 'overview-section') {
            section.style.display = 'none';
        }
    });
    
    // Add click events to navigation links
    document.querySelectorAll('.sidebar nav ul li a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active nav item
            document.querySelectorAll('.sidebar nav ul li').forEach(item => {
                item.classList.remove('active');
            });
            this.parentElement.classList.add('active');
            
            // Show corresponding section
            const targetId = this.getAttribute('href').substring(1);
            document.querySelectorAll('.dashboard-section').forEach(section => {
                section.style.display = 'none';
            });
            document.getElementById(targetId).style.display = 'block';
        });
    });
}

// Setup modal events
function setupModalEvents() {
    const modal = document.getElementById('order-details-modal');
    const closeBtn = document.querySelector('.close-modal');
    
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Load overview dashboard data
function loadDashboardData() {
    // Simulate API calls to get data from all systems
    Promise.all([
        fetch('http://localhost:7001/api/retailer/orders').then(response => response.json()),
        fetch('http://localhost:7002/api/supplier/pending-orders').then(response => response.json()),
        fetch('http://localhost:7003/api/manufacturer/orders-in-production').then(response => response.json()),
        fetch('http://localhost:7004/api/distributor/shipped-shipments').then(response => response.json())
    ])
    .then(([retailerData, supplierData, manufacturerData, distributorData]) => {
        // Process and combine data
        const allOrders = retailerData.orders || [];
        const pendingOrders = allOrders.filter(order => order.status === 'Pending').length;
        const inProductionOrders = allOrders.filter(order => order.status === 'In Production').length;
        const shippedOrders = allOrders.filter(order => order.status === 'Shipped').length;
        const deliveredOrders = allOrders.filter(order => order.status === 'Delivered').length;
        
        // Update count displays
        document.getElementById('total-orders-count').textContent = allOrders.length;
        document.getElementById('pending-orders-count').textContent = pendingOrders;
        document.getElementById('production-orders-count').textContent = inProductionOrders;
        document.getElementById('shipping-orders-count').textContent = shippedOrders;
        document.getElementById('completed-orders-count').textContent = deliveredOrders;
        
        // Create Order Status Chart
        createOrderStatusChart(pendingOrders, inProductionOrders, shippedOrders, deliveredOrders);
        
        // Create Orders by Month Chart
        createOrdersByMonthChart(allOrders);
    })
    .catch(error => {
        console.error('Error loading dashboard data:', error);
    });
}

// Create chart showing orders by status
function createOrderStatusChart(pending, inProduction, shipped, delivered) {
    const ctx = document.getElementById('orders-by-status-chart').getContext('2d');
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Pending', 'In Production', 'Shipped', 'Delivered'],
            datasets: [{
                data: [pending, inProduction, shipped, delivered],
                backgroundColor: ['#f39c12', '#9b59b6', '#3498db', '#2ecc71'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Create chart showing orders by month
function createOrdersByMonthChart(orders) {
    // Group orders by month
    const monthlyData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize with zeros
    months.forEach(month => {
        monthlyData[month] = 0;
    });
    
    // Count orders by month
    orders.forEach(order => {
        const date = new Date(order.createdAt);
        const month = months[date.getMonth()];
        monthlyData[month]++;
    });
    
    const ctx = document.getElementById('orders-by-month-chart').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Number of Orders',
                data: Object.values(monthlyData),
                backgroundColor: '#3498db',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Orders'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Month'
                    }
                }
            }
        }
    });
}

// Load orders data for order management section
function loadOrdersData() {
    // Get filter values
    const statusFilter = document.getElementById('status-filter').value;
    const dateRangeFilter = document.getElementById('date-range').value;
    
    // Fetch orders from retailer system
    fetch('http://localhost:7001/api/retailer/orders')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch orders');
            }
            return response.json();
        })
        .then(data => {
            const orders = data.orders || [];
            
            // Apply filters
            let filteredOrders = orders;
            
            if (statusFilter !== 'all') {
                filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
            }
            
            if (dateRangeFilter !== 'all') {
                const now = new Date();
                const today = new Date(now.setHours(0, 0, 0, 0));
                
                switch (dateRangeFilter) {
                    case 'today':
                        filteredOrders = filteredOrders.filter(order => {
                            const orderDate = new Date(order.createdAt);
                            return orderDate >= today;
                        });
                        break;
                    case 'week':
                        const weekStart = new Date(now);
                        weekStart.setDate(now.getDate() - now.getDay());
                        weekStart.setHours(0, 0, 0, 0);
                        
                        filteredOrders = filteredOrders.filter(order => {
                            const orderDate = new Date(order.createdAt);
                            return orderDate >= weekStart;
                        });
                        break;
                    case 'month':
                        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                        
                        filteredOrders = filteredOrders.filter(order => {
                            const orderDate = new Date(order.createdAt);
                            return orderDate >= monthStart;
                        });
                        break;
                    case 'quarter':
                        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
                        const quarterStart = new Date(now.getFullYear(), quarterMonth, 1);
                        
                        filteredOrders = filteredOrders.filter(order => {
                            const orderDate = new Date(order.createdAt);
                            return orderDate >= quarterStart;
                        });
                        break;
                    case 'year':
                        const yearStart = new Date(now.getFullYear(), 0, 1);
                        
                        filteredOrders = filteredOrders.filter(order => {
                            const orderDate = new Date(order.createdAt);
                            return orderDate >= yearStart;
                        });
                        break;
                }
            }
            
            // Update the orders table
            updateOrdersTable(filteredOrders);
        })
        .catch(error => {
            console.error('Error loading orders data:', error);
            document.getElementById('orders-table-body').innerHTML = `
                <tr><td colspan="8">Error loading orders. Please try again.</td></tr>
            `;
        });
}

// Update the orders table with filtered data
function updateOrdersTable(orders) {
    const tableBody = document.getElementById('orders-table-body');
    
    if (!orders || orders.length === 0) {
        tableBody.innerHTML = `
            <tr><td colspan="8">No orders found matching the selected filters.</td></tr>
        `;
        return;
    }
    
    tableBody.innerHTML = '';
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        const orderDate = new Date(order.createdAt).toLocaleDateString();
        
        row.innerHTML = `
            <td>${order._id}</td>
            <td>${order.retailerEmail}</td>
            <td>${order.productName}</td>
            <td>${order.productMaterial}</td>
            <td>${order.quantity}</td>
            <td><span class="status-badge status-${order.status.toLowerCase().replace(' ', '-')}">${order.status}</span></td>
            <td>${orderDate}</td>
            <td>
                <button class="btn-primary view-details-btn" data-order-id="${order._id}">View Details</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to view details buttons
    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            showOrderDetails(orderId, orders);
        });
    });
}

// Show order details in modal
function showOrderDetails(orderId, orders) {
    const order = orders.find(o => o._id === orderId);
    
    if (!order) {
        alert('Order details not found');
        return;
    }
    
    const modal = document.getElementById('order-details-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('order-details-content');
    
    modalTitle.textContent = `Order Details: ${orderId}`;
    
    const orderDate = new Date(order.createdAt).toLocaleString();
    const updatedDate = new Date(order.updatedAt).toLocaleString();
    
    modalContent.innerHTML = `
        <div class="order-details">
            <div class="detail-row">
                <div class="detail-label">Customer:</div>
                <div class="detail-value">${order.retailerEmail}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Product:</div>
                <div class="detail-value">${order.productName}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Material:</div>
                <div class="detail-value">${order.productMaterial}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Quantity:</div>
                <div class="detail-value">${order.quantity}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Status:</div>
                <div class="detail-value"><span class="status-badge status-${order.status.toLowerCase().replace(' ', '-')}">${order.status}</span></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Order Date:</div>
                <div class="detail-value">${orderDate}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Last Updated:</div>
                <div class="detail-value">${updatedDate}</div>
            </div>
        </div>
        
        <div class="order-timeline">
            <h3>Order Timeline</h3>
            <div class="timeline">
                <div class="timeline-item ${order.createdAt ? 'completed' : ''}">
                    <div class="timeline-badge"></div>
                    <div class="timeline-content">
                        <h4>Order Placed</h4>
                        <p>${orderDate}</p>
                    </div>
                </div>
                <div class="timeline-item ${order.status !== 'Pending' ? 'completed' : ''}">
                    <div class="timeline-badge"></div>
                    <div class="timeline-content">
                        <h4>Order Processed</h4>
                        <p>${order.status !== 'Pending' ? 'Completed' : 'Pending'}</p>
                    </div>
                </div>
                <div class="timeline-item ${order.status === 'In Production' || order.status === 'Shipped' || order.status === 'Delivered' ? 'completed' : ''}">
                    <div class="timeline-badge"></div>
                    <div class="timeline-content">
                        <h4>In Production</h4>
                        <p>${order.status === 'In Production' || order.status === 'Shipped' || order.status === 'Delivered' ? 'Completed' : 'Pending'}</p>
                    </div>
                </div>
                <div class="timeline-item ${order.status === 'Shipped' || order.status === 'Delivered' ? 'completed' : ''}">
                    <div class="timeline-badge"></div>
                    <div class="timeline-content">
                        <h4>Shipped</h4>
                        <p>${order.status === 'Shipped' || order.status === 'Delivered' ? 'Completed' : 'Pending'}</p>
                    </div>
                </div>
                <div class="timeline-item ${order.status === 'Delivered' ? 'completed' : ''}">
                    <div class="timeline-badge"></div>
                    <div class="timeline-content">
                        <h4>Delivered</h4>
                        <p>${order.status === 'Delivered' ? 'Completed' : 'Pending'}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add some CSS for the order details and timeline
    const style = document.createElement('style');
    style.textContent = `
        .order-details {
            margin-bottom: 30px;
        }
        .detail-row {
            display: flex;
            margin-bottom: 10px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        .detail-label {
            width: 120px;
            font-weight: bold;
            color: #7f8c8d;
        }
        .detail-value {
            flex: 1;
        }
        .order-timeline h3 {
            margin-bottom: 15px;
            color: #2c3e50;
        }
        .timeline {
            position: relative;
            padding-left: 30px;
        }
        .timeline::before {
            content: '';
            position: absolute;
            top: 0;
            bottom: 0;
            left: 15px;
            width: 2px;
            background-color: #e0e0e0;
        }
        .timeline-item {
            position: relative;
            margin-bottom: 20px;
        }
        .timeline-badge {
            position: absolute;
            left: -30px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background-color: #e0e0e0;
            border: 2px solid white;
            top: 2px;
        }
        .timeline-item.completed .timeline-badge {
            background-color: #2ecc71;
        }
        .timeline-content {
            padding-left: 10px;
        }
        .timeline-content h4 {
            margin: 0 0 5px;
            color: #2c3e50;
        }
        .timeline-content p {
            margin: 0;
            color: #7f8c8d;
        }
    `;
    document.head.appendChild(style);
    
    // Show the modal
    modal.style.display = 'block';
}

// Load inventory data
function loadInventoryData() {
    // Fetch inventory data from supplier system
    fetch('http://localhost:7002/api/supplier/material-inventory')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch inventory data');
            }
            return response.json();
        })
        .then(data => {
            const materials = data.materials || [];
            
            // Update inventory table
            updateInventoryTable(materials);
            
            // Create inventory charts
            createInventoryCharts(materials);
        })
        .catch(error => {
            console.error('Error loading inventory data:', error);
            document.getElementById('inventory-table-body').innerHTML = `
                <tr><td colspan="5">Error loading inventory data. Please try again.</td></tr>
            `;
        });
}

// Update inventory table
function updateInventoryTable(materials) {
    const tableBody = document.getElementById('inventory-table-body');
    
    if (!materials || materials.length === 0) {
        tableBody.innerHTML = `
            <tr><td colspan="5">No inventory data available.</td></tr>
        `;
        return;
    }
    
    tableBody.innerHTML = '';
    
    materials.forEach(material => {
        const row = document.createElement('tr');
        
        // Determine status based on stock level
        let status = 'In Stock';
        let statusClass = 'status-delivered';
        
        if (material.stock <= 20) {
            status = 'Low Stock';
            statusClass = 'status-pending';
        } else if (material.stock <= 50) {
            status = 'Medium Stock';
            statusClass = 'status-accepted';
        }
        
        row.innerHTML = `
            <td>${material.name}</td>
            <td>${material.stock} units</td>
            <td>25 units</td>
            <td>20 units</td>
            <td><span class="status-badge ${statusClass}">${status}</span></td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Create inventory charts
function createInventoryCharts(materials) {
    // Material Stock Levels Chart
    const inventoryCtx = document.getElementById('inventory-chart').getContext('2d');
    
    new Chart(inventoryCtx, {
        type: 'bar',
        data: {
            labels: materials.map(material => material.name),
            datasets: [{
                label: 'Current Stock',
                data: materials.map(material => material.stock),
                backgroundColor: materials.map(material => {
                    if (material.stock <= 20) return '#e74c3c';
                    if (material.stock <= 50) return '#f39c12';
                    return '#2ecc71';
                }),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Stock Level (Units)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Material'
                    }
                }
            }
        }
    });
    
    // Material Usage Chart (simulated data)
    const usageCtx = document.getElementById('material-usage-chart').getContext('2d');
    
    // Simulate usage data over the last 6 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    new Chart(usageCtx, {
        type: 'line',
        data: {
            labels: months,
            datasets: materials.map(material => ({
                label: material.name,
                data: months.map(() => Math.floor(Math.random() * 50) + 10),
                borderColor: getRandomColor(),
                tension: 0.1,
                fill: false
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Units Used'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Month'
                    }
                }
            }
        }
    });
}

// Load advanced analytics data
function loadAdvancedAnalytics() {
    // Fetch data from all systems for advanced analytics
    Promise.all([
        fetch('http://localhost:7001/api/retailer/orders').then(response => response.json())
    ])
    .then(([retailerData]) => {
        const orders = retailerData.orders || [];
        
        // Processing Time Chart
        createProcessingTimeChart();
        
        // Orders by Material Chart
        createMaterialDistributionChart(orders);
        
        // Historical Order Volume Chart
        createHistoricalOrdersChart(orders);
        
        // Completion Rate Chart
        createCompletionRateChart(orders);
        
        // Update KPI metrics
        updateAnalyticsMetrics(orders);
    })
    .catch(error => {
        console.error('Error loading advanced analytics data:', error);
    });
}

// Create chart for average processing time
function createProcessingTimeChart() {
    const ctx = document.getElementById('processing-time-chart').getContext('2d');
    
    // Simulate processing time data
    const stages = ['Order to Acceptance', 'Acceptance to Production', 'Production to Shipping', 'Shipping to Delivery'];
    const processingTimes = [1.2, 2.5, 1.8, 3.2]; // in days
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: stages,
            datasets: [{
                label: 'Average Days',
                data: processingTimes,
                backgroundColor: '#3498db',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Days'
                    }
                }
            }
        }
    });
}

// Create chart for orders by material type
function createMaterialDistributionChart(orders) {
    const ctx = document.getElementById('material-distribution-chart').getContext('2d');
    
    // Group orders by material
    const materialCounts = {};
    
    orders.forEach(order => {
        if (!materialCounts[order.productMaterial]) {
            materialCounts[order.productMaterial] = 0;
        }
        materialCounts[order.productMaterial]++;
    });
    
    const materials = Object.keys(materialCounts);
    const counts = Object.values(materialCounts);
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: materials,
            datasets: [{
                data: counts,
                backgroundColor: materials.map(() => getRandomColor()),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Create chart for historical order volume
function createHistoricalOrdersChart(orders) {
    const ctx = document.getElementById('historical-orders-chart').getContext('2d');
    
    // Group orders by month
    const monthlyData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize with zeros
    months.forEach(month => {
        monthlyData[month] = 0;
    });
    
    // Count orders by month
    orders.forEach(order => {
        const date = new Date(order.createdAt);
        const month = months[date.getMonth()];
        monthlyData[month]++;
    });
    
    // Create data for current and previous year (simulated for previous year)
    const prevYearData = months.map(() => Math.floor(Math.random() * 15) + 5);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Current Year',
                    data: Object.values(monthlyData),
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Previous Year',
                    data: prevYearData,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Orders'
                    }
                }
            }
        }
    });
}

// Create chart for completion rate
function createCompletionRateChart(orders) {
    const ctx = document.getElementById('completion-rate-chart').getContext('2d');
    
    // Calculate completion rate by month
    const monthlyRates = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize with zeros
    months.forEach(month => {
        monthlyRates[month] = { total: 0, completed: 0 };
    });
    
    // Count total and completed orders by month
    orders.forEach(order => {
        const date = new Date(order.createdAt);
        const month = months[date.getMonth()];
        
        monthlyRates[month].total++;
        
        if (order.status === 'Delivered') {
            monthlyRates[month].completed++;
        }
    });
    
    // Calculate completion rates
    const completionRates = months.map(month => {
        const { total, completed } = monthlyRates[month];
        return total > 0 ? (completed / total) * 100 : 0;
    });
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Completion Rate (%)',
                data: completionRates,
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Completion Rate (%)'
                    }
                }
            }
        }
    });
}

// Update analytics metrics
function updateAnalyticsMetrics(orders) {
    // Calculate average processing time
    const completedOrders = orders.filter(order => order.status === 'Delivered');
    const avgProcessingTime = completedOrders.length > 0 ? 8.7 : 0; // simulated average time
    
    document.getElementById('avg-processing-time').textContent = `${avgProcessingTime.toFixed(1)} days`;
    
    // Calculate order acceptance rate
    const acceptedOrders = orders.filter(order => order.status !== 'Pending' && order.status !== 'Rejected');
    const acceptanceRate = orders.length > 0 ? (acceptedOrders.length / orders.length) * 100 : 0;
    
    document.getElementById('order-acceptance-rate').textContent = `${acceptanceRate.toFixed(1)}%`;
    
    // Calculate on-time delivery rate (simulated)
    const onTimeRate = 89.5; // simulated rate
    
    document.getElementById('on-time-delivery-rate').textContent = `${onTimeRate.toFixed(1)}%`;
    
    // Find most used material
    const materialCounts = {};
    
    orders.forEach(order => {
        if (!materialCounts[order.productMaterial]) {
            materialCounts[order.productMaterial] = 0;
        }
        materialCounts[order.productMaterial]++;
    });
    
    let mostUsedMaterial = 'N/A';
    let maxCount = 0;
    
    for (const material in materialCounts) {
        if (materialCounts[material] > maxCount) {
            maxCount = materialCounts[material];
            mostUsedMaterial = material;
        }
    }
    
    document.getElementById('most-used-material').textContent = mostUsedMaterial;
}

// Load user data
function loadUserData() {
    // Simulate user data
    document.getElementById('retailers-count').textContent = '15';
    document.getElementById('suppliers-count').textContent = '8';
    document.getElementById('manufacturers-count').textContent = '5';
    document.getElementById('distributors-count').textContent = '3';
}

// Helper function to generate random colors
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}