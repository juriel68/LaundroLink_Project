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
            flex-direction: column;
            height: 100vh;
            overflow: auto; /* Changed to auto to allow scrolling if content overflows */
        }

        /* --- Title Box --- */
        .title-box {
            background: white;
            border-radius: 10px;
            max-width: 1100px;
            margin: 30px auto 20px;
            padding: 25px 40px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        .title-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 15px;
        }

        h1 { 
            color: #004aad; 
            margin-bottom: 8px; 
        }

        p { 
            color: #555; 
            margin: 0; 
        }

        /* --- Date Filters --- */
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

        /* --- Custom Range --- */
        .custom-range-container {
            margin-top: 15px;
            padding: 15px;
            background-color: #f1f3f5;
            border-radius: 8px;
            display: none;
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

        /* --- KPI Cards --- */
        .kpi-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 20px;
            max-width: 1100px;
            margin: 0 auto 20px;
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

        #pending-card { 
            border-top: 4px solid #6c757d; 
        }

        #processing-card { 
            border-top: 4px solid #ffc107; 
        }

        #delivery-card { 
            border-top: 4px solid #17a2b8; 
        }

        #completed-card { 
            border-top: 4px solid #28a745; 
        }

        #rejected-card { 
            border-top: 4px solid #dc3545; 
        }

        /* --- Table --- */
        .table-container {
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.08);
            width: 90%;
            max-width: 1100px;
            margin: 0 auto 30px auto;
            flex-grow: 1;
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

        tbody tr:last-child td { 
            border-bottom: none; 
        }

        tr:nth-child(even) { 
            background-color: #f9f9f9; 
        }

        tr:hover { 
            background-color: #eef3ff; 
        }

        /* --- Sorting --- */
        .sort-btn {
            background: none; 
            border: none; 
            color: white; 
            cursor: pointer;
            font-size: 1em; 
            margin-left: 8px; 
            padding: 0 5px; 
            opacity: 0.6;
            transition: opacity 0.2s ease-in-out;
        }

        th:hover .sort-btn { 
            opacity: 1; 
        }

        .sort-btn.active { 
            opacity: 1; 
            color: #ffc107; 
        }
        .sort-btn 
        .fa-sort-up, 
        .sort-btn 
        .fa-sort-down { 
            display: none; 
        }

        .sort-btn.active.asc .fa-sort { 
            display: none; 
        }

        .sort-btn.active.asc .fa-sort-up { 
            display: inline-block; 
        }

        .sort-btn.active.desc .fa-sort { 
            display: none; 
        }

        .sort-btn.active.desc .fa-sort-down { 
            display: inline-block; 
        }

        /* --- Status Colors --- */
        .status { 
            font-weight: bold; 
        }
        .status-completed { 
            color: #28a745; 
        }

        .status-processing { 
            color: #ffc107; 
        }

        .status-pending { 
            color: #6c757d; 
        }

        .status-rejected, 
        .status-cancelled { 
            color: #dc3545; 
        }

        .status-for-delivery { 
            color: #17a2b8; 
        }

        /* --- Pagination Controls --- */
        .pagination-controls {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            padding: 15px 0;
            max-width: 1100px;
            width: 90%;
            margin: 0 auto;
            gap: 10px;
        }
        .pagination-controls button {
            background: #004aad;
            border: none;
            color: #fff;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
        }
        .pagination-controls button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        .pagination-controls span {
            margin: 0 10px;
            font-weight: 500;
            font-size: 14px;
        }
        
    </style>
</head>
<body>

    <!-- Title Section -->
    <div class="title-box">
        <div class="title-row">
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

        <!-- Custom Date Range -->
        <div class="custom-range-container" id="custom-range-picker">
            <label for="start-date">From:</label>
            <input type="date" id="start-date">
            <label for="end-date">To:</label>
            <input type="date" id="end-date">
            <button id="apply-custom-range">Apply</button>
        </div>
    </div>

    <!-- KPI Section -->
    <div class="kpi-row">
        <div class="kpi-card" id="pending-card"><h4>Pending</h4><div class="value" id="pending-count">0</div></div>
        <div class="kpi-card" id="processing-card"><h4>Processing</h4><div class="value" id="processing-count">0</div></div>
        <div class="kpi-card" id="delivery-card"><h4>For Delivery</h4><div class="value" id="delivery-count">0</div></div>
        <div class="kpi-card" id="completed-card"><h4>Completed</h4><div class="value" id="completed-count">0</div></div>
        <div class="kpi-card" id="rejected-card"><h4>Rejected</h4><div class="value" id="rejected-count">0</div></div>
    </div>

    <!-- Table Section -->
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
            <tbody id="orders-table-body"></tbody>
        </table>
    </div>
    
    <!-- PAGINATION CONTROLS -->
    <div class="pagination-controls">
        <button id="prevPageBtn" disabled>Previous</button>
        <span id="pageInfo">Page 1 of 1</span>
        <button id="nextPageBtn" disabled>Next</button>
    </div>

    <script type="module">
        import { API_BASE_URL } from '/Web/api.js';

        // --- GLOBAL STATE & ELEMENTS ---
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
        const dateFilters = document.querySelectorAll('.date-filters button');
        const sortButtons = document.querySelectorAll('.sort-btn');
        
        const prevPageBtn = document.getElementById('prevPageBtn');
        const nextPageBtn = document.getElementById('nextPageBtn');
        const pageInfoSpan = document.getElementById('pageInfo');
        
        const ROWS_PER_PAGE = 15;
        let currentPage = 1;
        let totalOrders = 0;
        let currentSortBy = 'OrderCreatedAt';
        let currentSortOrder = 'DESC';

        // --- RENDER & UTILITY FUNCTIONS ---

        const updateKpiCards = (summary) => {
            pendingCountEl.textContent = summary.pending || 0;
            processingCountEl.textContent = summary.processing || 0;
            deliveryCountEl.textContent = summary.forDelivery || 0;
            completedCountEl.textContent = summary.completed || 0;
            rejectedCountEl.textContent = summary.rejected || 0;
        };

        const updatePaginationControls = () => {
            const totalPages = Math.ceil(totalOrders / ROWS_PER_PAGE);
            pageInfoSpan.textContent = `Page ${currentPage} of ${totalPages > 0 ? totalPages : 1} (Total: ${totalOrders})`;
            prevPageBtn.disabled = currentPage === 1;
            nextPageBtn.disabled = currentPage >= totalPages;
        };
        
        const renderTable = (orders) => {
            tableBody.innerHTML = '';
            if (!orders || orders.length === 0) {
                const message = totalOrders > 0 ? 
                    'No orders found on this page.' : 
                    'No orders found for this period.';
                tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">${message}</td></tr>`;
                return;
            }
            
            orders.forEach(order => {
                const statusClass = `status-${String(order.OrderStatus || 'pending').toLowerCase().replace(/[\s\/-]/g, '-')}`;
                const formattedPrice = `₱${parseFloat(order.PayAmount || 0).toFixed(2)}`;
                const formattedDate = new Date(order.OrderCreatedAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
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
            
            updatePaginationControls();
        };

        // --- MAIN FETCH FUNCTION ---

        const fetchOrderData = async (filter = { period: 'Today' }, page = 1) => {
            if (!loggedInUser || !loggedInUser.ShopID) {
                tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Error: Shop ID not found. Please log in again.</td></tr>';
                return;
            }
            
            currentPage = page;
            const limit = ROWS_PER_PAGE;
            const offset = (currentPage - 1) * limit;

            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading orders...</td></tr>';
            updateKpiCards({});
            
            try {
                let apiUrl = `${API_BASE_URL}/orders/overview/${loggedInUser.ShopID}`;
                
                const params = new URLSearchParams({
                    sortBy: currentSortBy,
                    sortOrder: currentSortOrder,
                    limit: limit,
                    offset: offset
                });

                // Apply period or custom range filters
                if (filter.period && filter.period !== 'Custom') {
                    params.append('period', filter.period);
                } else if (filter.startDate && filter.endDate) {
                    params.append('startDate', filter.startDate);
                    params.append('endDate', filter.endDate);
                }

                apiUrl += `?${params.toString()}`;

                const response = await fetch(apiUrl);
                if (!response.ok) throw new Error('Failed to fetch order data.');
                
                const data = await response.json();
                
                // Assuming backend returns { summary: {...}, orders: [...], totalCount: N }
                const orders = data.orders || [];
                totalOrders = data.totalCount || orders.length; // Get the total count for pagination

                updateKpiCards(data.summary || {});
                renderTable(orders);
                
            } catch (error) {
                console.error('Fetch error:', error);
                tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Error loading orders.</td></tr>`;
                totalOrders = 0;
                updatePaginationControls();
            }
        };

        // --- EVENT HANDLERS ---
        
        // Pagination Handlers
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                const currentFilter = getCurrentFilterState();
                fetchOrderData(currentFilter, currentPage - 1);
            }
        });

        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(totalOrders / ROWS_PER_PAGE);
            if (currentPage < totalPages) {
                const currentFilter = getCurrentFilterState();
                fetchOrderData(currentFilter, currentPage + 1);
            }
        });
        
        // Returns the current date/period filter state
        const getCurrentFilterState = () => {
            const activePeriodBtn = document.querySelector('.date-filters button.active');
            const period = activePeriodBtn.dataset.period;
            
            if (period === 'Custom') {
                return { 
                    startDate: startDateInput.value, 
                    endDate: endDateInput.value 
                };
            }
            return { period };
        };

        document.addEventListener('DOMContentLoaded', () => {
            
            // --- Date Filter Button Logic ---
            dateFilters.forEach(button => {
                button.addEventListener('click', () => {
                    const period = button.dataset.period;
                    
                    if (period === 'Custom') {
                        customRangePicker.style.display = 'flex';
                        // Do not fetch data yet, just set the active filter
                    } else {
                        customRangePicker.style.display = 'none';
                        // Reset pagination to 1 and fetch new data
                        fetchOrderData({ period }, 1);
                    }

                    dateFilters.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                });
            });

            // --- Custom Range Apply Button Logic ---
            document.getElementById('apply-custom-range').addEventListener('click', () => {
                const startDate = startDateInput.value;
                const endDate = endDateInput.value;
                if (startDate && endDate) {
                    if (new Date(startDate) > new Date(endDate)) {
                        alert('Start date cannot be after the end date.');
                        return;
                    }
                    // Reset pagination to 1 and fetch custom range
                    fetchOrderData({ startDate, endDate }, 1);
                } else {
                    alert('Please select both a start and end date.');
                }
            });

            // --- Sorting Logic ---
            sortButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const sortBy = button.dataset.sort;
                    
                    if (currentSortBy === sortBy) {
                        currentSortOrder = currentSortOrder === 'ASC' ? 'DESC' : 'ASC';
                    } else {
                        currentSortBy = sortBy;
                        currentSortOrder = 'DESC';
                    }

                    sortButtons.forEach(btn => btn.classList.remove('active', 'asc', 'desc'));
                    if (button.dataset.sort === currentSortBy) {
                        button.classList.add('active', currentSortOrder.toLowerCase());
                    }
                    
                    // Reset pagination to 1 and fetch with new sort/filter
                    fetchOrderData(getCurrentFilterState(), 1);
                });
            });

            // Initial load for "Today"
            fetchOrderData({ period: 'Today' });
        });
    </script>
</body>
</html>