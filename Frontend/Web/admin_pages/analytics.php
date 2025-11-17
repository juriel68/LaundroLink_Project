<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LaundroLink | Data Analytics</title>
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

        .chart-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 20px;
            margin-bottom: 20px;
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

        .chart-card .subtitle {
            font-size: 14px;
            color: #666;
            margin-top: -15px;
            margin-bottom: 20px;
            font-style: italic;
        }

        .analytics-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }

        .analytics-table th, 
        .analytics-table td {
            padding: 10px 15px;
            border-bottom: 1px solid #eee;
            text-align: left;
        }

        .analytics-table th {
            background-color: #f8f9fa;
            color: #004aad;
            font-weight: 600;
        }

        .analytics-table tbody tr:hover {
            background-color: #f4f4f4;
        }

        .analytics-table td:last-child {
            font-weight: 700;
            color: #333;
        }
    </style>
</head>
<body>

    <div class="section">
        <h1>Data Analytics</h1>
        <p>Deep insights into platform health, growth trends, and strategic opportunities.</p>
    </div>

    <div class="content-area">

        <div class="chart-grid">
            <div class="chart-card">
                <h4>Platform Growth (Monthly)</h4>
                <p class="subtitle">Historical revenue and new shop acquisition over time.</p>
                <canvas id="platformGrowthChart" height="100"></canvas>
            </div>
        </div>

        <div class="chart-grid">
            <div class="chart-card">
                <h4>Service Gap Analysis (Top 10)</h4>
                <p class="subtitle">Identifies services with high demand (total orders) but low supply (few shops offering it).</p>
                <table class="analytics-table">
                    <thead>
                        <tr>
                            <th>Service Name</th>
                            <th>Platform Order Count (Demand)</th>
                            <th>Offering Shop Count (Supply)</th>
                            <th>Gap Score (Demand ÷ Supply)</th>
                        </tr>
                    </thead>
                    <tbody id="service-gap-table-body">
                        <tr><td colspan="4" style="text-align: center;">Loading analytics data...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script type="module">
        import { API_BASE_URL } from '/Web/api.js'; 
        
        let platformGrowthChart;

        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
        };
        
        function initializeCharts() {
            // Platform Growth Chart (Combined Bar/Line)
            const growthCtx = document.getElementById('platformGrowthChart').getContext('2d');
            platformGrowthChart = new Chart(growthCtx, {
                type: 'bar', // Default type, datasets will override
                data: {
                    labels: [],
                    datasets: [
                        {
                            type: 'bar',
                            label: 'New Shops',
                            data: [],
                            backgroundColor: 'rgba(0, 74, 173, 0.2)',
                            borderColor: 'rgba(0, 74, 173, 1)',
                            borderWidth: 1,
                            yAxisID: 'yShops', // Correctly assigned to the count axis
                        },
                        {
                            type: 'line',
                            label: 'Monthly Revenue',
                            data: [],
                            borderColor: '#28a745',
                            backgroundColor: 'rgba(40, 167, 69, 0.1)',
                            tension: 0.3,
                            fill: true,
                            yAxisID: 'yRevenue', // Correctly assigned to the currency axis
                        }
                    ]
                },
                options: {
                    scales: {
                        x: {
                            stacked: false, // Ensure bars are side-by-side, not stacked on the same axis
                        },
                        // Left Y-Axis for Revenue
                        yRevenue: {
                            type: 'linear',
                            position: 'left',
                            ticks: {
                                // Format as currency
                                callback: function(value, index, values) {
                                    return formatCurrency(value);
                                }
                            }
                        },
                        // Right Y-Axis for New Shops
                        yShops: {
                            type: 'linear',
                            position: 'right',
                            grid: {
                                drawOnChartArea: false, // Only show grid for revenue
                            },
                            ticks: {
                                precision: 0 // No decimals for shop count
                            }
                        }
                    }
                }
            });
        }
        
        async function fetchPlatformGrowth() {
            try {
                const res = await fetch(`${API_BASE_URL}/admin/analytics/growth-trend`);
                if (!res.ok) throw new Error('Failed to fetch growth trend');
                const data = await res.json();

                // Data is fetched in descending order, reverse for chart
                const chartData = data.reverse(); 

                platformGrowthChart.data.labels = chartData.map(d => d.label); // 'YYYY-MM'
                platformGrowthChart.data.datasets[0].data = chartData.map(d => d.NewShops);
                platformGrowthChart.data.datasets[1].data = chartData.map(d => d.revenue);
                platformGrowthChart.update();

            } catch (error) {
                console.error('Error fetching platform growth:', error);
                // Handle error in UI
            }
        }
        
        async function fetchServiceGaps() {
            const tableBody = document.getElementById('service-gap-table-body');
            try {
                const res = await fetch(`${API_BASE_URL}/admin/analytics/service-gaps`);
                if (!res.ok) throw new Error('Failed to fetch service gaps');
                const data = await res.json();

                if (data.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No service gap data available. Run the analytics script.</td></tr>';
                    return;
                }

                tableBody.innerHTML = ''; // Clear loading message
                data.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${item.SvcName}</td>
                        <td>${item.PlatformOrderCount.toLocaleString()}</td>
                        <td>${item.OfferingShopCount.toLocaleString()}</td>
                        <td>${parseFloat(item.GapScore).toFixed(2)}</td>
                    `;
                    tableBody.appendChild(row);
                });

            } catch (error) {
                console.error('Error fetching service gaps:', error);
                tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">Error: ${error.message}</td></tr>`;
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            initializeCharts();
            fetchPlatformGrowth();
            fetchServiceGaps();
        });
    </script>
</body>
</html>