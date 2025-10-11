<?php
// --- Mock data setup ---
$current_filter = "This Month";
$mock_kpi_data = [
    'revenue' => 5420.50, 'revenue_change_percent' => 50, 'revenue_change_status' => 'positive',
    'orders' => 980, 'orders_change_percent' => 50, 'orders_change_status' => 'positive',
    'aov' => 5.53, 'aov_change_percent' => 20, 'aov_change_status' => 'negative',
    'new_customers' => 45, 'customers_change_percent' => 100, 'customers_change_status' => 'positive',
];
$mock_employees = [
    ['name' => 'Jane Doe', 'revenue' => 1950.00],
    ['name' => 'John Smith', 'revenue' => 1800.50],
    ['name' => 'Alice Johnson', 'revenue' => 1200.00],
    ['name' => 'Bob Brown', 'revenue' => 580.75],
    ['name' => 'Chris Lee', 'revenue' => 450.00],
];
$sales_trend_labels = ['4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM', '10 PM'];
$sales_trend_data = [20, 45, 60, 55, 70, 85, 95];
$order_types = [
    ['label' => 'Wash & Fold', 'percent' => 60],
    ['label' => 'Dry Cleaning', 'percent' => 30],
    ['label' => 'Others', 'percent' => 10],
];
?>
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
            color: #333;
        }

        /* 🔹 Top Title Section */
        .section {
            background: white;
            border-radius: 10px;
            max-width: 1100px;
            margin: 30px auto 40px;
            padding: 25px 40px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
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

        /* 🔹 Dashboard Container */
        .content-area {
            max-width: 1100px;
            margin: 0 auto;
            padding-bottom: 50px;
        }

        /* 🔹 Header Controls */
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
        }

        .date-filters button.active {
            background-color: #004aad;
            color: white;
            border-color: #004aad;
        }

        .btn-primary, .btn-secondary {
            padding: 10px 15px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 600;
            transition: 0.2s;
        }

        .btn-primary { background-color: #004aad; color: white; }
        .btn-primary:hover { background-color: #003c8a; }
        .btn-secondary { background-color: #6c757d; color: white; }
        .btn-secondary:hover { background-color: #5a6268; }

        /* 🔹 KPI Cards */
        .kpi-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
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

        .kpi-card:hover { transform: translateY(-3px); }

        .kpi-card h4 {
            margin-top: 0;
            color: #6c757d;
            font-size: 14px;
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
        }

        .kpi-card .change.positive { color: green; }
        .kpi-card .change.negative { color: red; }

        /* 🔹 Charts */
        .charts-row {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }

        .chart-card {
            background-color: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }

        .chart-card h4 {
            margin: 0 0 15px;
            border-bottom: 1px solid #eee;
            padding-bottom: 8px;
            font-size: 16px;
            color: #004aad;
        }

        /* 🔹 Bottom Row */
        .bottom-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        .employee-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .employee-list li {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
            font-size: 15px;
        }

        .employee-list .name {
            font-weight: 600;
        }

        @media (max-width: 768px) {
            .charts-row, .bottom-row {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>

    <!-- 🔹 Top Section -->
    <div class="section">
        <h1>Reports</h1>
        <p>Analyze your shop’s performance through key metrics, charts, and employee insights.</p>
    </div>

    <div class="content-area">

        <!-- Header Controls -->
        <div class="dashboard-header">
            <div class="date-filters">
                <button class="active"><?php echo $current_filter; ?></button>
                <button>Last 7 Days</button>
                <button>Yesterday</button>
                <button>Custom Range</button>
            </div>
            <div>
                <button class="btn-primary">Download Daily Report</button>
                <button class="btn-secondary">Download Monthly Report</button>
            </div>
        </div>

        <!-- KPI Row -->
        <div class="kpi-row">
            <?php foreach ([
                'Total Revenue' => ['value' => '$' . number_format($mock_kpi_data['revenue'], 2), 'change' => $mock_kpi_data['revenue_change_percent'], 'status' => $mock_kpi_data['revenue_change_status']],
                'Total Orders' => ['value' => number_format($mock_kpi_data['orders']), 'change' => $mock_kpi_data['orders_change_percent'], 'status' => $mock_kpi_data['orders_change_status']],
                'Average Order Value (AOV)' => ['value' => '$' . number_format($mock_kpi_data['aov'], 2), 'change' => $mock_kpi_data['aov_change_percent'], 'status' => $mock_kpi_data['aov_change_status']],
                'New Customers' => ['value' => number_format($mock_kpi_data['new_customers']), 'change' => $mock_kpi_data['customers_change_percent'], 'status' => $mock_kpi_data['customers_change_status']],
            ] as $title => $data): ?>
                <div class="kpi-card">
                    <h4><?= $title ?></h4>
                    <div class="value"><?= $data['value'] ?></div>
                    <div class="change <?= $data['status'] ?>">
                        <i class="fas fa-caret-<?= $data['status'] == 'positive' ? 'up' : 'down' ?>"></i>
                        <?= $data['change'] ?>% vs. Last Period
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

        <!-- Charts -->
        <div class="charts-row">
            <div class="chart-card">
                <h4>Sales Trend (Hourly)</h4>
                <canvas id="salesTrendChart" height="120"></canvas>
            </div>
            <div class="chart-card">
                <h4>Order Type Breakdown</h4>
                <canvas id="orderTypeChart" height="200"></canvas>
            </div>
        </div>

        <!-- Bottom Row -->
        <div class="bottom-row">
            <div class="chart-card">
                <h4>Busiest Hours</h4>
                <canvas id="busiestHoursChart" height="150"></canvas>
            </div>
            <div class="chart-card">
                <h4>Top 5 Employees (by Revenue)</h4>
                <ul class="employee-list">
                    <?php foreach ($mock_employees as $employee): ?>
                        <li>
                            <span class="name"><?= htmlspecialchars($employee['name']) ?></span>
                            <span class="value">$<?= number_format($employee['revenue'], 2) ?></span>
                        </li>
                    <?php endforeach; ?>
                </ul>
            </div>
        </div>
    </div>

    <script>
        const salesTrendLabels = <?php echo json_encode($sales_trend_labels); ?>;
        const salesTrendData = <?php echo json_encode($sales_trend_data); ?>;
        const orderTypes = <?php echo json_encode($order_types); ?>;

        // Sales Trend Line Chart
        new Chart(document.getElementById('salesTrendChart'), {
            type: 'line',
            data: {
                labels: salesTrendLabels,
                datasets: [{
                    label: 'Orders',
                    data: salesTrendData,
                    borderColor: '#004aad',
                    backgroundColor: 'rgba(0,74,173,0.1)',
                    fill: true,
                    tension: 0.3,
                }]
            },
            options: { scales: { y: { beginAtZero: true } } }
        });

        // Order Type Doughnut Chart
        new Chart(document.getElementById('orderTypeChart'), {
            type: 'doughnut',
            data: {
                labels: orderTypes.map(o => o.label),
                datasets: [{
                    data: orderTypes.map(o => o.percent),
                    backgroundColor: ['#004aad', '#28a745', '#ffc107'],
                }]
            },
            options: { plugins: { legend: { position: 'bottom' } } }
        });

        // Busiest Hours Bar Chart
        new Chart(document.getElementById('busiestHoursChart'), {
            type: 'bar',
            data: {
                labels: salesTrendLabels,
                datasets: [{
                    label: 'Orders',
                    data: salesTrendData,
                    backgroundColor: 'rgba(0,74,173,0.5)',
                    borderColor: '#004aad',
                    borderWidth: 1,
                }]
            },
            options: { scales: { y: { beginAtZero: true } } }
        });
    </script>
</body>
</html>
