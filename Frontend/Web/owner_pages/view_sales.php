<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Sales</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            background-color: #f8f9fa;
        }

        .title-box {
            background: white;
            border-radius: 10px;
            max-width: 1100px;
            margin: 30px auto 40px;
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

        .kpi-row {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            max-width: 1100px;
            margin: 0 auto 20px auto;
        }

        .kpi-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.05);
            border-top: 4px solid #004aad;
        }

        .kpi-card h4 {
            margin: 0 0 5px 0;
            font-size: 14px;
            color: #6c757d;
            font-weight: 600;
        }

        .kpi-card .value {
            font-size: 2rem;
            font-weight: 700;
            color: #343a40;
        }

        .table-container {
            width: 90%;
            max-width: 1100px;
            margin: 0 auto 30px auto;
            flex-grow: 1;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.08);
            overflow: hidden;
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

    <div class="title-box">
        <div class="title-row">
            <div>
                <h1>Sales</h1>
                <p>View sales performance and transaction history.</p>
            </div>
            <div class="date-filters">
                <button class="active" data-period="Weekly">This Week</button>
                <button data-period="Monthly">This Month</button>
                <button data-period="Yearly">This Year</button>
            </div>
        </div>
    </div>

    <div class="kpi-row">
        <div class="kpi-card">
            <h4>Total Sales</h4>
            <div class="value" id="total-sales">₱0.00</div>
        </div>
        <div class="kpi-card">
            <h4>Number of Sales</h4>
            <div class="value" id="num-sales">0</div>
        </div>
        <div class="kpi-card">
            <h4>Average Sale Value</h4>
            <div class="value" id="avg-sale">₱0.00</div>
        </div>
    </div>

    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Order ID</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody id="sales-table-body">
                <tr><td colspan="3" style="text-align:center; padding:20px;">Loading sales data...</td></tr>
            </tbody>
        </table>
    </div>

    <div class="pagination-controls">
        <button id="prevPageBtn" disabled>Previous</button>
        <span id="pageInfo">Page 1 of 1</span>
        <button id="nextPageBtn" disabled>Next</button>
    </div>

    <script type="module">
        import { API_BASE_URL } from '../api.js';

        // --- GLOBAL STATE & ELEMENTS ---
        const tableBody = document.getElementById('sales-table-body');
        const loggedInUser = JSON.parse(localStorage.getItem('laundroUser'));
        
        const totalSalesEl = document.getElementById('total-sales');
        const numSalesEl = document.getElementById('num-sales');
        const avgSaleEl = document.getElementById('avg-sale');
        const dateFilters = document.querySelectorAll('.date-filters button');

        const prevPageBtn = document.getElementById('prevPageBtn');
        const nextPageBtn = document.getElementById('nextPageBtn');
        const pageInfoSpan = document.getElementById('pageInfo');
        
        let currentPage = 1;
        const ROWS_PER_PAGE = 15;
        let totalTransactions = 0;
        let currentPeriod = 'Weekly';

        // --- UTILITY FUNCTIONS ---

        const formatCurrency = (amount) => `₱${parseFloat(amount || 0).toFixed(2)}`;
        const COLSPAN = 3;

        const updateKpiCards = (summary) => {
            const totalSales = parseFloat(summary.totalSales || 0);
            // 🟢 FIXED: Use correct count from new backend response
            const totalTxns = parseInt(summary.totalOrders || 0, 10); 

            const avgSale = totalTxns > 0 ? (totalSales / totalTxns) : 0;

            totalSalesEl.textContent = formatCurrency(totalSales);
            numSalesEl.textContent = totalTxns.toLocaleString();
            avgSaleEl.textContent = formatCurrency(avgSale);
        };
        
        const updatePaginationControls = () => {
            const totalPages = Math.ceil(totalTransactions / ROWS_PER_PAGE);
            const displayPage = totalPages > 0 ? currentPage : 1;
            const displayTotal = totalPages > 0 ? totalPages : 1;
            
            pageInfoSpan.textContent = `Page ${displayPage} of ${displayTotal} (Total: ${totalTransactions})`;
            prevPageBtn.disabled = currentPage === 1;
            nextPageBtn.disabled = currentPage >= totalPages || totalPages === 0;
        };

        const renderTable = (transactions) => {
            tableBody.innerHTML = '';
            if (!transactions || transactions.length === 0) {
                const message = totalTransactions > 0 ? 
                    'No sales found on this page.' : 
                    'No sales found for this period.';
                tableBody.innerHTML = `<tr><td colspan="${COLSPAN}" style="text-align:center; padding: 20px; color: #777;">${message}</td></tr>`;
                return;
            }
            
            transactions.forEach(sale => {
                const dateObj = new Date(sale.PaidAt);
                const formattedDate = !isNaN(dateObj) ? dateObj.toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                }) : 'N/A';

                const row = document.createElement('tr');
                // 🟢 FIXED: Added Payment Type Label (Service vs Delivery)
                row.innerHTML = `
                    <td>${formattedDate}</td>
                    <td>${sale.OrderID} <span style="font-size:11px; color:#888; margin-left:5px;">(${sale.Type})</span></td>
                    <td style="font-weight:600; color:#2ecc71;">${formatCurrency(sale.PayAmount)}</td>
                `;
                tableBody.appendChild(row);
            });
            updatePaginationControls();
        };

        // --- MAIN FETCH FUNCTION ---

        const fetchSalesData = async (period = 'Weekly', page = 1) => {
            currentPeriod = period;
            currentPage = page;

            if (!loggedInUser || !loggedInUser.ShopID) {
                tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Error: Shop ID not found.</td></tr>';
                return;
            }
            
            const limit = ROWS_PER_PAGE;
            const offset = (currentPage - 1) * limit;

            tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 20px;">Loading...</td></tr>';

            try {
                const params = new URLSearchParams({
                    period: currentPeriod,
                    limit: limit,
                    offset: offset
                });
                
                // 🟢 FIXED: Using correct backend route /orders/sales/:shopId
                const apiUrl = `${API_BASE_URL}/orders/sales/${loggedInUser.ShopID}?${params.toString()}`;
                
                const response = await fetch(apiUrl);
                if (!response.ok) throw new Error('Failed to fetch sales data.');
                
                const data = await response.json();

                totalTransactions = data.totalCount || 0; 
                
                updateKpiCards(data.summary || {});
                renderTable(data.transactions);

            } catch (error) {
                console.error('Fetch error:', error);
                tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center; color: red;">Error loading sales data.</td></tr>`;
                totalTransactions = 0;
                updateKpiCards({});
                updatePaginationControls();
            }
        };
        
        // --- EVENT HANDLERS ---
        
        dateFilters.forEach(button => {
            button.addEventListener('click', () => {
                dateFilters.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                fetchSalesData(button.dataset.period, 1);
            });
        });
        
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                fetchSalesData(currentPeriod, currentPage - 1);
            }
        });

        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(totalTransactions / ROWS_PER_PAGE);
            if (currentPage < totalPages) {
                fetchSalesData(currentPeriod, currentPage + 1);
            }
        });

        document.addEventListener('DOMContentLoaded', () => {
            fetchSalesData('Weekly', 1);
        });
    </script>

</body>
</html>