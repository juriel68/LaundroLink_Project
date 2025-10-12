<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Orders</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            background-color: #f8f9fa;
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow: hidden;
        }
        .header-container {
            width: 90%;
            max-width: 1100px;
            margin: 30px auto 20px auto;
            flex-shrink: 0;
        }
        .top-box {
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.05);
            padding: 25px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
        }
        h1 { color: #004aad; margin-bottom: 8px; }
        p { color: #555; margin: 0; }

        .date-filters button {
            padding: 8px 15px;
            margin-left: 5px;
            border: 1px solid #ccc;
            background-color: white;
            cursor: pointer;
            border-radius: 6px;
            transition: 0.2s;
            font-weight: 600;
        }
        .date-filters button.active {
            background-color: #004aad;
            color: white;
            border-color: #004aad;
        }
        .custom-range-container {
            margin-top: 15px;
            padding: 15px;
            background-color: #f1f3f5;
            border-radius: 8px;
            display: none; /* Hidden by default */
            align-items: center;
            gap: 10px;
        }
        .custom-range-container input[type="date"] {
            padding: 6px;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        .custom-range-container button {
            padding: 7px 15px;
            border: none;
            border-radius: 4px;
            background-color: #004aad;
            color: white;
            cursor: pointer;
        }

        .kpi-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .kpi-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
        .kpi-card h4 {
            margin: 0 0 5px 0;
            font-size: 14px;
            color: #6c757d;
            font-weight: 600;
        }
        .kpi-card .value {
            font-size: 2.25rem;
            font-weight: 700;
            color: #343a40;
        }
        #pending-card { border-top: 4px solid #6c757d; }
        #processing-card { border-top: 4px solid #ffc107; }
        #delivery-card { border-top: 4px solid #17a2b8; }
        #completed-card { border-top: 4px solid #28a745; }
        #rejected-card { border-top: 4px solid #dc3545; }


        .table-container {
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.08);
            width: 90%;
            max-width: 1100px;
            margin: 0 auto 30px auto;
            flex-grow: 1;
            overflow-y: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        th {
            background-color: #004aad;
            color: white;
            font-weight: 600;
            font-size: 15px;
            position: sticky;
            top: 0;
            z-index: 1;
        }
        tbody tr:last-child td { border-bottom: none; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        tr:hover { background-color: #eef3ff; }

        .sort-btn {
            background: none; border: none; color: white; cursor: pointer;
            font-size: 1em; margin-left: 8px; padding: 0 5px; opacity: 0.6;
            transition: opacity 0.2s ease-in-out;
        }
        th:hover .sort-btn { opacity: 1; }
        .sort-btn.active { opacity: 1; color: #ffc107; }
        .sort-btn .fa-sort-up, .sort-btn .fa-sort-down { display: none; }
        .sort-btn.active.asc .fa-sort { display: none; }
        .sort-btn.active.asc .fa-sort-up { display: inline-block; }
        .sort-btn.active.desc .fa-sort { display: none; }
        .sort-btn.active.desc .fa-sort-down { display: inline-block; }
        
        .status { font-weight: bold; }
        .status-completed { color: #28a745; }
        .status-processing { color: #ffc107; }
        .status-pending { color: #6c757d; }
        .status-rejected, .status-cancelled { color: #dc3545; }
        .status-for-delivery { color: #17a2b8; }
    </style>
</head>
<body>

    <div class="header-container">
        <div class="top-box">
            <div>
                <h1>Orders</h1>
                <p>View the complete order history and status overview for your shop.</p>
            </div>
            <div class="date-filters">
                <button class="active" data-period="Today">Today</button>
                <button data-period="Weekly">This Week</button>
                <button data-period="Monthly">This Month</button>
                <button data-period="Yearly">This Year</button>
                <button data-period="Custom">Custom</button>
            </div>
        </div>
        
        <div class="custom-range-container" id="custom-range-picker">
            <label for="start-date">From:</label>
            <input type="date" id="start-date">
            <label for="end-date">To:</label>
            <input type="date" id="end-date">
            <button id="apply-custom-range">Apply</button>
        </div>
        
        <div class="kpi-row">
            <div class="kpi-card" id="pending-card"><h4>Pending</h4><div class="value" id="pending-count">0</div></div>
            <div class="kpi-card" id="processing-card"><h4>Processing</h4><div class="value" id="processing-count">0</div></div>
            <div class="kpi-card" id="delivery-card"><h4>For Delivery</h4><div class="value" id="delivery-count">0</div></div>
            <div class="kpi-card" id="completed-card"><h4>Completed</h4><div class="value" id="completed-count">0</div></div>
            <div class="kpi-card" id="rejected-card"><h4>Rejected</h4><div class="value" id="rejected-count">0</div></div>
        </div>
    </div>

    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Customer ID</th>
                    <th>
                        Service Name
                        <button class="sort-btn" data-sort="SvcName"><i class="fas fa-sort"></i><i class="fas fa-sort-up"></i><i class="fas fa-sort-down"></i></button>
                    </th>
                    <th>Amount</th>
                    <th>
                        Status
                        <button class="sort-btn" data-sort="OrderStatus"><i class="fas fa-sort"></i><i class="fas fa-sort-up"></i><i class="fas fa-sort-down"></i></button>
                    </th>
                    <th>
                        Date Created
                        <button class="sort-btn active desc" data-sort="OrderCreatedAt"><i class="fas fa-sort"></i><i class="fas fa-sort-up"></i><i class="fas fa-sort-down"></i></button>
                    </th>
                </tr>
            </thead>
            <tbody id="orders-table-body">
                </tbody>
        </table>
    </div>

    <script type="module">
        import { API_BASE_URL } from '/Web/api.js';

        const tableBody = document.getElementById('orders-table-body');
        const loggedInUser = JSON.parse(localStorage.getItem('laundroUser'));
        
        const pendingCountEl = document.getElementById('pending-count');
        const processingCountEl = document.getElementById('processing-count');
        const deliveryCountEl = document.getElementById('delivery-count');
        const completedCountEl = document.getElementById('completed-count');
        const rejectedCountEl = document.getElementById('rejected-count');
        
        const customRangePicker = document.getElementById('custom-range-picker');
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');

        let currentSortBy = 'OrderCreatedAt';
        let currentSortOrder = 'DESC';

        const updateKpiCards = (summary) => {
            pendingCountEl.textContent = summary.pending || 0;
            processingCountEl.textContent = summary.processing || 0;
            deliveryCountEl.textContent = summary.forDelivery || 0;
            completedCountEl.textContent = summary.completed || 0;
            rejectedCountEl.textContent = summary.rejected || 0;
        };

        const renderTable = (orders) => {
            tableBody.innerHTML = '';
            if (!orders || orders.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No orders found for this period.</td></tr>';
                return;
            }
            orders.forEach(order => {
                const statusClass = `status-${String(order.OrderStatus || 'pending').toLowerCase().replace(' ', '-')}`;
                const formattedPrice = `₱${parseFloat(order.PayAmount || 0).toFixed(2)}`;
                const formattedDate = new Date(order.OrderCreatedAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric'
                });
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${order.OrderID}</td>
                    <td>${order.CustID}</td>
                    <td>${order.SvcName || 'N/A'}</td>
                    <td>${formattedPrice}</td>
                    <td class="status ${statusClass}">${order.OrderStatus || 'N/A'}</td>
                    <td>${formattedDate}</td>
                `;
                tableBody.appendChild(row);
            });
        };

        const fetchOrderData = async (filter = { period: 'Today' }) => {
            if (!loggedInUser || !loggedInUser.ShopID) {
                tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Error: Shop ID not found. Please log in again.</td></tr>';
                return;
            }
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading orders...</td></tr>';
            updateKpiCards({});
            
            try {
                let apiUrl = `${API_BASE_URL}/orders/overview/${loggedInUser.ShopID}?sortBy=${currentSortBy}&sortOrder=${currentSortOrder}`;
                if (filter.period) {
                    apiUrl += `&period=${filter.period}`;
                } else if (filter.startDate && filter.endDate) {
                    apiUrl += `&startDate=${filter.startDate}&endDate=${filter.endDate}`;
                }

                const response = await fetch(apiUrl);
                if (!response.ok) throw new Error('Failed to fetch order data.');
                const data = await response.json();
                
                updateKpiCards(data.summary);
                renderTable(data.orders);
            } catch (error) {
                console.error('Fetch error:', error);
                tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Error loading orders. Please check the console.</td></tr>`;
            }
        };

        document.addEventListener('DOMContentLoaded', () => {
            const filterButtons = document.querySelectorAll('.date-filters button');
            
            filterButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const period = button.dataset.period;
                    
                    if (period === 'Custom') {
                        customRangePicker.style.display = 'flex';
                    } else {
                        customRangePicker.style.display = 'none';
                        fetchOrderData({ period });
                    }

                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                });
            });

            document.getElementById('apply-custom-range').addEventListener('click', () => {
                const startDate = startDateInput.value;
                const endDate = endDateInput.value;
                if (startDate && endDate) {
                    if (new Date(startDate) > new Date(endDate)) {
                        alert('Start date cannot be after the end date.');
                        return;
                    }
                    fetchOrderData({ startDate, endDate });
                } else {
                    alert('Please select both a start and end date.');
                }
            });

            const sortButtons = document.querySelectorAll('.sort-btn');
            sortButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const sortBy = button.dataset.sort;
                    
                    if (currentSortBy === sortBy) {
                        currentSortOrder = currentSortOrder === 'ASC' ? 'DESC' : 'ASC';
                    } else {
                        currentSortBy = sortBy;
                        currentSortOrder = 'DESC';
                    }

                    sortButtons.forEach(btn => {
                        btn.classList.remove('active', 'asc', 'desc');
                        if (btn.dataset.sort === currentSortBy) {
                            btn.classList.add('active', currentSortOrder.toLowerCase());
                        }
                    });
                    fetchOrderData({ period: document.querySelector('.date-filters button.active').dataset.period });
                });
            });

            // Initial load for "Today"
            fetchOrderData({ period: 'Today' });
        });
    </script>
</body>
</html>