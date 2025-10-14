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
        overflow-y: auto;
        background: white;
        border-radius: 10px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.08);
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

    </style>
</head>
<body>

    <!-- Title Section -->
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

    <!-- KPI Section -->
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

    <!-- Sales Table -->
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
                </tbody>
        </table>
    </div>

    <script type="module">
        import { API_BASE_URL } from '/Web/api.js';

        const tableBody = document.getElementById('sales-table-body');
        const loggedInUser = JSON.parse(localStorage.getItem('laundroUser'));
        
        const totalSalesEl = document.getElementById('total-sales');
        const numSalesEl = document.getElementById('num-sales');
        const avgSaleEl = document.getElementById('avg-sale');

        const formatCurrency = (amount) => `₱${parseFloat(amount || 0).toFixed(2)}`;

        const updateKpiCards = (summary) => {
            const totalSales = summary.totalSales || 0;
            const totalOrders = summary.totalOrders || 0;
            const avgSale = totalOrders > 0 ? (totalSales / totalOrders) : 0;

            totalSalesEl.textContent = formatCurrency(totalSales);
            numSalesEl.textContent = totalOrders.toLocaleString();
            avgSaleEl.textContent = formatCurrency(avgSale);
        };

        const renderTable = (transactions) => {
            tableBody.innerHTML = '';
            if (!transactions || transactions.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No sales found for this period.</td></tr>';
                return;
            }
            transactions.forEach(sale => {
                const formattedDate = new Date(sale.OrderCreatedAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric'
                });
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${formattedDate}</td>
                    <td>${sale.OrderID}</td>
                    <td>${formatCurrency(sale.PayAmount)}</td>
                `;
                tableBody.appendChild(row);
            });
        };

        const fetchSalesData = async (period = 'Weekly') => {
            if (!loggedInUser || !loggedInUser.ShopID) {
                tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Error: Shop ID not found.</td></tr>';
                return;
            }
            
            // Show loading state
            tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Loading...</td></tr>';
            updateKpiCards({}); // Reset KPIs

            try {
                const response = await fetch(`${API_BASE_URL}/orders/sales/${loggedInUser.ShopID}?period=${period}`);
                if (!response.ok) throw new Error('Failed to fetch sales data.');
                
                const data = await response.json();
                updateKpiCards(data.summary);
                renderTable(data.transactions);

            } catch (error) {
                console.error('Fetch error:', error);
                tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Error loading sales data.</td></tr>`;
            }
        };

        document.addEventListener('DOMContentLoaded', () => {
            const filterButtons = document.querySelectorAll('.date-filters button');
            filterButtons.forEach(button => {
                button.addEventListener('click', () => {
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    fetchSalesData(button.dataset.period);
                });
            });

            // Initial load
            fetchSalesData('Weekly');
        });
    </script>

</body>
</html>
