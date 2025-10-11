<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LaundroLink | Reports Dashboard</title>
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
        .employee-list {
            list-style: none;
            padding: 0;
            margin: 0;
            max-height: 300px;
            overflow-y: auto;
        }
        .employee-list li {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 5px;
            border-bottom: 1px solid #f0f0f0;
            font-size: 15px;
        }
        .employee-list li:last-child { 
            border-bottom: none; 
        }
        .employee-list .name { 
            font-weight: 600; 
        }
        .employee-list .value { 
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
        <h1>Reports</h1>
        <p>Analyze your shop’s performance through key metrics, charts, and employee insights.</p>
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
                <h4>Total Revenue</h4>
                <div class="value" id="kpi-revenue-value">₱0.00</div>
                <div class="change" id="kpi-revenue-change">Loading...</div>
            </div>
            <div class="kpi-card">
                <h4>Total Orders</h4>
                <div class="value" id="kpi-orders-value">0</div>
                <div class="change" id="kpi-orders-change">Loading...</div>
            </div>
            <div class="kpi-card">
                <h4>Average Order Value</h4>
                <div class="value" id="kpi-aov-value">₱0.00</div>
                <div class="change" id="kpi-aov-change">Loading...</div>
            </div>
            <div class="kpi-card">
                <h4>New Customers</h4>
                <div class="value" id="kpi-customers-value">0</div>
                <div class="change" id="kpi-customers-change">Loading...</div>
            </div>
        </div>

        <div class="charts-row">
            <div class="chart-card">
                <h4>Sales Trend</h4>
                <canvas id="salesTrendChart" height="150"></canvas>
            </div>
            <div class="chart-card">
                <h4>Order Type Breakdown</h4>
                <canvas id="orderTypeChart" height="150"></canvas>
            </div>
        </div>

        <div class="bottom-row">
            <div class="chart-card">
                <h4>Top 5 Staff (by Revenue)</h4>
                <ul class="employee-list" id="employee-list">
                    </ul>
            </div>
        </div>
    </div>

    <script type="module">
        import { API_BASE_URL } from '/Web/api.js'; 
        
        let salesTrendChart, orderTypeChart;
        
        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
        };
        
        function initializeCharts() {
            const salesCtx = document.getElementById('salesTrendChart').getContext('2d');
            salesTrendChart = new Chart(salesCtx, {
                type: 'line',
                data: { labels: [], datasets: [{ label: 'Revenue', data: [], borderColor: '#004aad', backgroundColor: 'rgba(0, 74, 173, 0.1)', fill: true, tension: 0.3 }] },
                options: { scales: { y: { beginAtZero: true } } }
            });

            const orderCtx = document.getElementById('orderTypeChart').getContext('2d');
            orderTypeChart = new Chart(orderCtx, {
                type: 'doughnut',
                data: { labels: [], datasets: [{ data: [], backgroundColor: ['#004aad', '#28a745', '#ffc107', '#dc3545', '#6c757d'] }] },
                options: { plugins: { legend: { position: 'bottom' } } }
            });
        }
        
        function updateKpiCards(summary) {
            const revenue = summary.totalRevenue || 0;
            const orders = summary.totalOrders || 0;
            const aov = orders > 0 ? (revenue / orders) : 0;

            document.getElementById('kpi-revenue-value').textContent = formatCurrency(revenue);
            document.getElementById('kpi-orders-value').textContent = orders.toLocaleString();
            document.getElementById('kpi-aov-value').textContent = formatCurrency(aov);
            document.getElementById('kpi-customers-value').textContent = (summary.newCustomers || 0).toLocaleString();

            const currentPeriodText = document.querySelector('.date-filters button.active').textContent;
            document.getElementById('kpi-revenue-change').textContent = `For ${currentPeriodText}`;
            document.getElementById('kpi-orders-change').textContent = `For ${currentPeriodText}`;
            document.getElementById('kpi-aov-change').textContent = `For ${currentPeriodText}`;
            document.getElementById('kpi-customers-change').textContent = `For ${currentPeriodText}`;
        }
        
        function updateSalesTrendChart(chartData) {
            salesTrendChart.data.labels = chartData.map(d => d.label);
            salesTrendChart.data.datasets[0].data = chartData.map(d => d.value);
            salesTrendChart.update();
        }
        
        function updateOrderTypeChart(orderTypes) {
            orderTypeChart.data.labels = orderTypes.map(o => o.label);
            orderTypeChart.data.datasets[0].data = orderTypes.map(o => o.count);
            orderTypeChart.update();
        }

        function updateEmployeeList(employees) {
            const listElement = document.getElementById('employee-list');
            listElement.innerHTML = ''; 

            if (!employees || employees.length === 0) {
                listElement.innerHTML = '<li>No staff revenue data available for this period.</li>';
                return;
            }

            employees.forEach(employee => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span class="name">${employee.name}</span>
                    <span class="value">${formatCurrency(employee.revenue)}</span>
                `;
                listElement.appendChild(li);
            });
        }
        
        function handleDownload() {
            const kpis = {
                "Total Revenue": document.getElementById('kpi-revenue-value').textContent,
                "Total Orders": document.getElementById('kpi-orders-value').textContent,
                "Average Order Value": document.getElementById('kpi-aov-value').textContent,
                "New Customers": document.getElementById('kpi-customers-value').textContent
            };

            const staff = [];
            document.querySelectorAll('#employee-list li').forEach(item => {
                const name = item.querySelector('.name')?.textContent;
                const revenue = item.querySelector('.value')?.textContent;
                if (name && revenue) {
                    staff.push({ name, revenue });
                }
            });

            const period = document.querySelector('.date-filters button.active').textContent;
            const user = JSON.parse(localStorage.getItem('laundroUser'));
            const shopName = user?.ShopName || 'LaundroLink';

            const salesTrendImg = salesTrendChart.toBase64Image();
            const orderTypeImg = orderTypeChart.toBase64Image();

            const form = document.createElement('form');
            form.method = 'POST';
            form.action = 'generate_report.php';
            form.target = '_blank';

            const dataToSend = {
                kpis: JSON.stringify(kpis),
                staff: JSON.stringify(staff),
                period: period,
                shopName: shopName,
                salesTrendImg: salesTrendImg,
                orderTypeImg: orderTypeImg
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
            const user = JSON.parse(localStorage.getItem('laundroUser'));
            if (!user || !user.ShopID) {
                alert("Authentication Error: Shop ID not found. Please log in again.");
                return;
            }
            const shopId = user.ShopID;
            
            try {
                const [summaryRes, orderTypeRes, employeesRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/orders/dashboard-summary`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ shopId, period })
                    }),
                    fetch(`${API_BASE_URL}/orders/report/order-types`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ shopId, period })
                    }),
                    fetch(`${API_BASE_URL}/orders/report/top-employees`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ shopId, period })
                    })
                ]);

                if (!summaryRes.ok || !orderTypeRes.ok || !employeesRes.ok) {
                    throw new Error('One or more API requests failed.');
                }

                const summaryData = await summaryRes.json();
                const orderTypeData = await orderTypeRes.json();
                const employeesData = await employeesRes.json();

                updateKpiCards(summaryData);
                updateSalesTrendChart(summaryData.chartData);
                updateOrderTypeChart(orderTypeData);
                updateEmployeeList(employeesData);

            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
                alert('Could not load dashboard data. Please ensure the backend server is running and check the console for more details.');
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

            const initialActiveButton = document.querySelector('.date-filters button.active');
            fetchDashboardData(initialActiveButton.dataset.period);
        });
    </script>
</body>
</html>