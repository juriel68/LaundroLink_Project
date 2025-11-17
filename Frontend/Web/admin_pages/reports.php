<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LaundroLink | Admin Platform Reports</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            margin: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            color: #333;
        }

        .section {
            background: white;
            border-radius: 10px;
            max-width: 1100px;
            margin: 30px auto 40px;
            padding: 25px 40px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }

        .section h1 {
            color: #004aad;
            margin-bottom: 8px;
        }

        .section p {
            color: #555;
            margin: 0;
            font-size: 15px;
        }

        .content-area {
            max-width: 1100px;
            margin: 0 auto;
            padding-bottom: 50px;
        }

        .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            margin-bottom: 25px;
            gap: 10px;
        }

        .date-filters button {
            padding: 8px 15px;
            margin-right: 5px;
            border: 1px solid #ccc;
            background-color: white;
            cursor: pointer;
            border-radius: 4px;
            transition: 0.2s;
            font-weight: 600;
        }

        .date-filters button.active {
            background-color: #004aad;
            color: white;
            border-color: #004aad;
        }

        .btn-primary {
            padding: 10px 15px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 600;
            transition: 0.2s;
            background-color: #004aad; 
            color: white;
        }

        .btn-primary:hover { 
            background-color: #003c8a; 
        }

        .kpi-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .kpi-card {
            background-color: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.05);
            transition: transform 0.2s ease;
        }

        .kpi-card:hover { 
            transform: translateY(-3px); 
        }

        .kpi-card h4 {
            margin-top: 0;
            color: #6c757d;
            font-size: 14px;
            font-weight: 600;
        }

        .kpi-card .value {
            font-size: 2rem;
            font-weight: 700;
            color: #343a40;
            margin-bottom: 6px;
        }

        .kpi-card .change {
            font-size: 0.9rem;
            font-weight: 500;
            color: #6c757d;
        }

        .charts-row, .bottom-row {
            display: grid;
            gap: 20px;
            margin-bottom: 20px;
        }

        .charts-row { 
            grid-template-columns: 2fr 1fr; 
        }

        .bottom-row { 
            grid-template-columns: 1fr; 
        }

        .chart-card {
            background-color: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }

        .chart-card h4 {
            margin: 0 0 20px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
            font-size: 16px;
            color: #004aad;
        }

        .shop-list {
            list-style: none;
            padding: 0;
            margin: 0;
            max-height: 300px;
            overflow-y: auto;
        }

        .shop-list li {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 5px;
            border-bottom: 1px solid #f0f0f0;
            font-size: 15px;
        }

        .shop-list li:last-child { 
            border-bottom: none; 
        }

        .shop-list .name { 
            font-weight: 600; 
        }

        .shop-list .value { 
            font-weight: 500; 
            color: #004aad; 
        }

        @media (max-width: 900px) {
            .charts-row { 
                grid-template-columns: 1fr; 
            }
        }

        @media (max-width: 768px) {
            .dashboard-header { 
                flex-direction: column; 
                align-items: stretch; 
            }
            .date-filters { 
                display: flex; 
                flex-wrap: wrap; 
                justify-content: center; 
            }
        }
        
    </style>
</head>
<body>

    <div class="section">
        <h1>Platform Reports</h1>
        <p>Analyze the entire LaundroLink platform’s performance through key metrics, charts, and top shop insights.</p>
    </div>

    <div class="content-area">

        <div class="dashboard-header">
            <div class="date-filters">
                <button class="active" data-period="Weekly">Last 7 Days</button>
                <button data-period="Monthly">This Month</button>
                <button data-period="Yearly">This Year</button>
            </div>
            <div>
                <button id="downloadReportBtn" class="btn-primary"><i class="fas fa-download"></i> Download Report</button>
            </div>
        </div>

        <div class="kpi-row">
            <div class="kpi-card">
                <h4>Total Platform Revenue</h4>
                <div class="value" id="kpi-revenue-value">₱0.00</div>
                <div class="change" id="kpi-revenue-change">Loading...</div>
            </div>
            <div class="kpi-card">
                <h4>Total Orders Processed</h4>
                <div class="value" id="kpi-orders-value">0</div>
                <div class="change" id="kpi-orders-change">Loading...</div>
            </div>
            <div class="kpi-card">
                <h4>New Shops Onboarded</h4>
                <div class="value" id="kpi-shops-value">0</div>
                <div class="change" id="kpi-shops-change">Loading...</div>
            </div>
            <div class="kpi-card">
                <h4>Average Order Value (Platform)</h4>
                <div class="value" id="kpi-aov-value">₱0.00</div>
                <div class="change" id="kpi-aov-change">Loading...</div>
            </div>
        </div>

        <div class="charts-row">
            <div class="chart-card">
                <h4>Platform Revenue Trend</h4>
                <canvas id="salesTrendChart" height="150"></canvas>
            </div>
            <div class="chart-card">
                <h4>Order Status Breakdown (All Shops)</h4>
                <canvas id="orderStatusChart" height="150"></canvas>
            </div>
        </div>

        <div class="bottom-row">
            <div class="chart-card">
                <h4>Top 10 Shops (by Revenue)</h4>
                <ul class="shop-list" id="shop-list">
                    </ul>
            </div>
        </div>
    </div>

    <script type="module">
        import { API_BASE_URL } from '/Web/api.js'; 
        
        let salesTrendChart, orderStatusChart;
        
        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
        };
        
        function initializeCharts() {
            // Platform Revenue Trend Chart (Line Chart)
            const salesCtx = document.getElementById('salesTrendChart').getContext('2d');
            salesTrendChart = new Chart(salesCtx, {
                type: 'line',
                data: { labels: [], datasets: [{ label: 'Revenue', data: [], borderColor: '#004aad', backgroundColor: 'rgba(0, 74, 173, 0.1)', fill: true, tension: 0.3 }] },
                options: { scales: { y: { beginAtZero: true } } }
            });

            // Order Status Breakdown Chart (Doughnut Chart)
            const orderCtx = document.getElementById('orderStatusChart').getContext('2d');
            orderStatusChart = new Chart(orderCtx, {
                type: 'doughnut',
                data: { 
                    labels: [], 
                    datasets: [{ 
                        data: [], 
                        backgroundColor: [
                            '#004aad', // Blue (In Progress)
                            '#28a745', // Green (Completed)
                            '#ffc107', // Yellow (Pending/Waiting)
                            '#dc3545', // Red (Canceled/Issue)
                            '#6c757d'  // Gray (Other)
                        ] 
                    }] 
                },
                options: { plugins: { legend: { position: 'bottom' } } }
            });
        }
        
        function updateKpiCards(summary) {
            const revenue = summary.totalRevenue || 0;
            const orders = summary.totalOrders || 0;
            const newShops = summary.newShops || 0;
            const aov = orders > 0 ? (revenue / orders) : 0;

            document.getElementById('kpi-revenue-value').textContent = formatCurrency(revenue);
            document.getElementById('kpi-orders-value').textContent = orders.toLocaleString();
            document.getElementById('kpi-shops-value').textContent = newShops.toLocaleString();
            document.getElementById('kpi-aov-value').textContent = formatCurrency(aov);

            const currentPeriodText = document.querySelector('.date-filters button.active').textContent;
            document.getElementById('kpi-revenue-change').textContent = `For ${currentPeriodText}`;
            document.getElementById('kpi-orders-change').textContent = `For ${currentPeriodText}`;
            document.getElementById('kpi-shops-change').textContent = `New shops for ${currentPeriodText}`;
            document.getElementById('kpi-aov-change').textContent = `For ${currentPeriodText}`;
        }
        
        function updateSalesTrendChart(chartData) {
            salesTrendChart.data.labels = chartData.map(d => d.label);
            salesTrendChart.data.datasets[0].data = chartData.map(d => d.value);
            salesTrendChart.update();
        }
        
        function updateOrderStatusChart(statuses) {
            orderStatusChart.data.labels = statuses.map(s => s.label);
            orderStatusChart.data.datasets[0].data = statuses.map(s => s.count);
            orderStatusChart.update();
        }

        function updateTopShopsList(shops) {
            const listElement = document.getElementById('shop-list');
            listElement.innerHTML = ''; 

            if (!shops || shops.length === 0) {
                listElement.innerHTML = '<li>No shop revenue data available for this period.</li>';
                return;
            }

            shops.forEach(shop => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span class="name">${shop.name}</span>
                    <span class="value">${formatCurrency(shop.revenue)}</span>
                `;
                listElement.appendChild(li);
            });
        }
        
        function handleDownload() {
            // Collect all current KPI values for the report
            const kpis = {
                "Total Platform Revenue": document.getElementById('kpi-revenue-value').textContent,
                "Total Orders Processed": document.getElementById('kpi-orders-value').textContent,
                "New Shops Onboarded": document.getElementById('kpi-shops-value').textContent,
                "Average Order Value (Platform)": document.getElementById('kpi-aov-value').textContent
            };

            // Collect Top 10 Shops data
            const topShops = [];
            document.querySelectorAll('#shop-list li').forEach(item => {
                const name = item.querySelector('.name')?.textContent;
                const revenue = item.querySelector('.value')?.textContent;
                if (name && revenue) {
                    topShops.push({ name, revenue });
                }
            });

            const period = document.querySelector('.date-filters button.active').textContent;
            
            // Get chart images as base64 strings
            const salesTrendImg = salesTrendChart.toBase64Image();
            const orderStatusImg = orderStatusChart.toBase64Image();

            // Create a temporary form to POST data to generate_report.php
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = 'generate_report.php'; // Admin's generate_report.php
            form.target = '_blank';

            const dataToSend = {
                kpis: JSON.stringify(kpis),
                topShops: JSON.stringify(topShops), // Use topShops instead of staff
                period: period,
                salesTrendImg: salesTrendImg,
                orderStatusImg: orderStatusImg // Use orderStatusImg
            };

            for (const key in dataToSend) {
                const hiddenField = document.createElement('input');
                hiddenField.type = 'hidden';
                hiddenField.name = key;
                hiddenField.value = dataToSend[key];
                form.appendChild(hiddenField);
            }

            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
        }

        async function fetchDashboardData(period) {
            // The Admin dashboard doesn't need a Shop ID, just the period
            
            try {
                const [summaryRes, orderStatusRes, topShopsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/admin/report/platform-summary`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ period })
                    }),
                    fetch(`${API_BASE_URL}/admin/report/order-status-breakdown`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ period })
                    }),
                    fetch(`${API_BASE_URL}/admin/report/top-shops`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ period })
                    })
                ]);

                if (!summaryRes.ok || !orderStatusRes.ok || !topShopsRes.ok) {
                    throw new Error('One or more Admin API requests failed.');
                }

                const summaryData = await summaryRes.json();
                const orderStatusData = await orderStatusRes.json();
                const topShopsData = await topShopsRes.json();

                updateKpiCards(summaryData);
                updateSalesTrendChart(summaryData.chartData);
                updateOrderStatusChart(orderStatusData);
                updateTopShopsList(topShopsData);

            } catch (error) {
                console.error('Failed to fetch Admin dashboard data:', error);
                // Use a standard message box instead of alert() if possible in a real app
                alert('Could not load platform data. Please ensure the backend server is running and check the console for details.');
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            initializeCharts();

            const filterButtons = document.querySelectorAll('.date-filters button');
            filterButtons.forEach(button => {
                button.addEventListener('click', () => {
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    const apiPeriod = button.dataset.period;
                    fetchDashboardData(apiPeriod);
                });
            });
            
            document.getElementById('downloadReportBtn').addEventListener('click', handleDownload);

            // Fetch data for the initial active period
            const initialActiveButton = document.querySelector('.date-filters button.active');
            fetchDashboardData(initialActiveButton.dataset.period);
        });
    </script>
</body>
</html>