<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>LaundroLink Owner Dashboard</title>
    <style>
        body {
            margin: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            display: flex;
        }
        .sidebar {
            width: 250px;
            background: #0D47A1;
            height: 100vh;
            color: white;
            padding-top: 20px;
            position: fixed;
            display: flex;
            flex-direction: column;
        }
        .sidebar h1 { font-size: 24px; text-align: center; margin-bottom: 30px; font-weight: 600; }
        .sidebar-nav { flex-grow: 1; display: flex; flex-direction: column;}
        .sidebar-nav a { display: block; color: #e0f2fe; text-decoration: none; padding: 15px 25px; margin: 5px 15px; border-radius: 8px; transition: background-color 0.3s; cursor: pointer; }
        .sidebar-nav a:hover, .sidebar-nav a.active { background-color: rgba(255, 255, 255, 0.15); color: white; font-weight: 600; }
        .main-content { margin-left: 250px; flex-grow: 1; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .header h2 { font-size: 32px; font-weight: 700; color: #1e3a8a; margin: 0; }
        .time-filter { display: flex; background-color: #e9ecef; border-radius: 8px; padding: 5px; }
        .time-filter button { padding: 8px 16px; border: none; background-color: transparent; border-radius: 6px; font-size: 14px; font-weight: 600; color: #495057; cursor: pointer; transition: background-color 0.3s, color 0.3s; }
        .time-filter button.active { background-color: #fff; color: #007bff; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 40px; }
        .kpi-card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05); border-left: 5px solid; }
        .kpi-card h3 { margin: 0 0 5px 0; font-size: 16px; color: #6c757d; font-weight: 500; }
        .kpi-card p { margin: 0; font-size: 36px; font-weight: 700; color: #343a40; }
        .chart-container { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05); }
        .container-title { font-size: 20px; font-weight: 600; color: #343a40; margin: 0 0 30px 0; }
        .chart-area { position: relative; width: 100%; height: 350px; }
        .chart-svg { width: 100%; height: 100%; }
    </style>

    <script>
        const userJSON = localStorage.getItem('laundroUser');
        if (!userJSON) {
            window.location.href = 'index.php';
        } else {
            const user = JSON.parse(userJSON);
            if (user.UserRole !== 'Shop Owner') {
                window.location.href = 'index.php';
            }
        }
    </script>
</head>
<body>
    <div class="sidebar">
        <h1>LaundroLink</h1>
        <nav class="sidebar-nav">
            <div>
                <a href="#" class="active" data-page="dashboard">Dashboard</a>
                <a href="#" data-page="view_orders">Order</a>
                <a href="#" data-page="manage_employees">Employee</a>
                <a href="#" data-page="manage_shop">Shop Details</a>
                <a href="#" data-page="view_sales">Sales</a>
                <a href="#" data-page="data_analytics">Data Analytics</a>
                <a href="#" data-page="reports">Reports</a>
            </div>
            <div class="logout-link">
                 <a id="logoutButton">Logout</a>
            </div>
        </nav>
    </div>

    <div class="main-content" id="content-area">
        <!-- Content will be loaded here -->
    </div>

    <script type="module">
        import { API_BASE_URL } from './api.js';
        
        const contentArea = document.getElementById('content-area');
        const navLinks = document.querySelectorAll('.sidebar-nav a');
        const loggedInUser = JSON.parse(localStorage.getItem('laundroUser'));

        function drawDashboard() {
            const dashboardHtml = `
                <div class="header">
                    <h2 id="shopNameHeader">Welcome, ${loggedInUser.ShopName || 'Owner'}!</h2>
                    <div class="time-filter">
                        <button id="weeklyBtn" class="active">Weekly</button>
                        <button id="monthlyBtn">Monthly</button>
                        <button id="yearlyBtn">Yearly</button>
                    </div>
                </div>
                <div class="kpi-grid">
                    <div class="kpi-card" style="border-color: #17a2b8;">
                        <h3>Total Revenue</h3>
                        <p id="totalRevenue">₱0.00</p>
                    </div>
                    <div class="kpi-card" style="border-color: #007bff;">
                        <h3>Total Orders</h3>
                        <p id="totalOrders">0</p>
                    </div>
                </div>
                <div class="chart-container">
                    <h3 class="container-title">Revenue Statistics</h3>
                    <div class="chart-area">
                        <svg class="chart-svg" id="chartSvg"></svg>
                    </div>
                </div>
            `;
            contentArea.innerHTML = dashboardHtml;
            attachDashboardListeners();
            fetchDashboardData('Weekly');
        }

        function attachDashboardListeners() {
            const weeklyBtn = document.getElementById('weeklyBtn');
            const monthlyBtn = document.getElementById('monthlyBtn');
            const yearlyBtn = document.getElementById('yearlyBtn');
            const buttons = [weeklyBtn, monthlyBtn, yearlyBtn];

            buttons.forEach(button => {
                button.addEventListener('click', () => {
                    buttons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    let period = 'Weekly';
                    if (button.id === 'monthlyBtn') period = 'Monthly';
                    if (button.id === 'yearlyBtn') period = 'Yearly';
                    fetchDashboardData(period);
                });
            });
        }
        
        async function fetchDashboardData(period) {
            if (!loggedInUser || !loggedInUser.ShopID) return;
            
            const chartSvg = document.getElementById('chartSvg');
            if (chartSvg) {
                chartSvg.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="#adb5bd" font-family="Segoe UI">Loading data...</text>`;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/orders/dashboard-summary`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ shopId: loggedInUser.ShopID, period: period })
                });
                if (!response.ok) throw new Error('Failed to fetch dashboard data');
                
                const data = await response.json();
                
                document.getElementById('totalRevenue').textContent = `₱${parseFloat(data.totalRevenue || 0).toFixed(2)}`;
                document.getElementById('totalOrders').textContent = data.totalOrders || 0;
                drawChart(data.chartData, period); // Pass period to drawChart

            } catch (error) {
                console.error("Dashboard fetch error:", error);
                if (chartSvg) {
                    chartSvg.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="#dc3545" font-family="Segoe UI">Error loading data.</text>`;
                }
            }
        }
        
        function drawChart(chartData, period) {
            const chartSvg = document.getElementById('chartSvg');
            chartSvg.innerHTML = '';
            if (!chartData || chartData.length === 0) {
                 chartSvg.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="#adb5bd" font-family="Segoe UI">No revenue data for this period.</text>`;
                 return;
            }
            const values = chartData.map(d => d.value);
            const labels = chartData.map(d => d.label);
            const maxProfit = Math.ceil(Math.max(...values, 1) / 1000) * 1000 || 1000;
            const svgNS = "http://www.w3.org/2000/svg";
            const padding = { top: 20, right: 20, bottom: 60, left: 70 }; // Adjusted padding for titles
            const svgWidth = chartSvg.clientWidth;
            const svgHeight = chartSvg.clientHeight;
            const chartWidth = svgWidth - padding.left - padding.right;
            const chartHeight = svgHeight - padding.top - padding.bottom;

            // Draw grid lines and Y-axis labels
            const numGridLines = 5;
            for (let i = 0; i <= numGridLines; i++) {
                const y = padding.top + (chartHeight / numGridLines) * i;
                const value = maxProfit - (maxProfit / numGridLines) * i;
                const gridLine = document.createElementNS(svgNS, 'line'); gridLine.setAttribute('x1', padding.left); gridLine.setAttribute('y1', y); gridLine.setAttribute('x2', svgWidth - padding.right); gridLine.setAttribute('y2', y); gridLine.setAttribute('stroke', '#5b5e61ff'); gridLine.setAttribute('stroke-dasharray', '3 3'); chartSvg.appendChild(gridLine);
                const yLabel = document.createElementNS(svgNS, 'text'); yLabel.setAttribute('x', padding.left - 10); yLabel.setAttribute('y', y + 4); yLabel.setAttribute('text-anchor', 'end'); yLabel.setAttribute('fill', '#1a1b1cff'); yLabel.setAttribute('font-size', '12'); yLabel.textContent = (value >= 1000) ? `₱${(value/1000)}k` : `₱${value}`; chartSvg.appendChild(yLabel);
            }

            // --- ADD AXIS TITLES ---
            let xAxisTitleText = 'Period';
            if (period === 'Weekly') xAxisTitleText = 'Days of the Week';
            if (period === 'Monthly') xAxisTitleText = 'Months';
            if (period === 'Yearly') xAxisTitleText = 'Years';
            
            // Y-Axis Title
            const yTitle = document.createElementNS(svgNS, 'text');
            yTitle.setAttribute('transform', `rotate(-90)`);
            yTitle.setAttribute('x', -(svgHeight / 2));
            yTitle.setAttribute('y', 20); // Position from the left edge
            yTitle.setAttribute('text-anchor', 'middle');
            yTitle.setAttribute('fill', '#000000ff');
            yTitle.setAttribute('font-size', '14');
            yTitle.setAttribute('font-weight', '600');
            yTitle.textContent = 'Profit Amount';
            chartSvg.appendChild(yTitle);

            // X-Axis Title
            const xTitle = document.createElementNS(svgNS, 'text');
            xTitle.setAttribute('x', padding.left + chartWidth / 2);
            xTitle.setAttribute('y', svgHeight - 10); // Position from the bottom edge
            xTitle.setAttribute('text-anchor', 'middle');
            xTitle.setAttribute('fill', '#000000ff');
            xTitle.setAttribute('font-size', '14');
            xTitle.setAttribute('font-weight', '600');
            xTitle.textContent = xAxisTitleText;
            chartSvg.appendChild(xTitle);
            
            // --- The rest of the chart drawing logic is unchanged ---
            const defs = document.createElementNS(svgNS, 'defs'); const gradient = document.createElementNS(svgNS, 'linearGradient'); gradient.id = 'areaGradient'; gradient.innerHTML = `<stop offset="0%" style="stop-color:#007bff; stop-opacity:0.4"/><stop offset="100%" style="stop-color:#007bff; stop-opacity:0"/>`; defs.appendChild(gradient); chartSvg.appendChild(defs);
            if (values.length === 1) {
                const value = values[0]; const x = padding.left + chartWidth / 2; const y = padding.top + chartHeight - (value / maxProfit) * chartHeight;
                const startX = padding.left; const endX = svgWidth - padding.right; const bottomY = svgHeight - padding.bottom; const controlX1 = x - chartWidth * 0.25; const controlX2 = x + chartWidth * 0.25; const lineD = `M ${startX},${bottomY} C ${controlX1},${bottomY} ${controlX1},${y} ${x},${y} S ${controlX2},${bottomY} ${endX},${bottomY}`;
                const areaPath = document.createElementNS(svgNS, 'path'); areaPath.setAttribute('d', lineD + ` Z`); areaPath.setAttribute('fill', 'url(#areaGradient)');
                const linePath = document.createElementNS(svgNS, 'path'); linePath.setAttribute('d', lineD); linePath.setAttribute('fill', 'none'); linePath.setAttribute('stroke', '#007bff'); linePath.setAttribute('stroke-width', '3');
                chartSvg.appendChild(areaPath); chartSvg.appendChild(linePath);
                const circle = document.createElementNS(svgNS, 'circle'); circle.setAttribute('cx', x); circle.setAttribute('cy', y); circle.setAttribute('r', '5'); circle.setAttribute('fill', '#007bff'); circle.setAttribute('stroke', 'white'); circle.setAttribute('stroke-width', '2'); chartSvg.appendChild(circle);
                const xLabel = document.createElementNS(svgNS, 'text'); xLabel.setAttribute('x', x); xLabel.setAttribute('y', svgHeight - padding.bottom + 20); xLabel.setAttribute('text-anchor', 'middle'); xLabel.setAttribute('fill', '#000000ff'); xLabel.setAttribute('font-size', '12'); xLabel.textContent = labels[0]; chartSvg.appendChild(xLabel);
            } else {
                const points = values.map((value, index) => ({ x: padding.left + (index / (labels.length - 1)) * chartWidth, y: padding.top + chartHeight - (value / maxProfit) * chartHeight }));
                const line = (points) => { let d = `M ${points[0].x} ${points[0].y}`; for (let i = 0; i < points.length - 1; i++) { const x_mid = (points[i].x + points[i+1].x) / 2; const cp_x1 = (x_mid + points[i].x) / 2; d += ` C ${cp_x1},${points[i].y} ${cp_x1},${points[i+1].y} ${points[i+1].x},${points[i+1].y}`; } return d; };
                const areaPath = document.createElementNS(svgNS, 'path'); areaPath.setAttribute('d', line(points) + ` L ${svgWidth - padding.right} ${svgHeight - padding.bottom} L ${padding.left} ${svgHeight - padding.bottom} Z`); areaPath.setAttribute('fill', 'url(#areaGradient)');
                const linePath = document.createElementNS(svgNS, 'path'); linePath.setAttribute('d', line(points)); linePath.setAttribute('fill', 'none'); linePath.setAttribute('stroke', '#007bff'); linePath.setAttribute('stroke-width', '3');
                chartSvg.appendChild(areaPath); chartSvg.appendChild(linePath);
                points.forEach((point, index) => {
                    const circle = document.createElementNS(svgNS, 'circle'); circle.setAttribute('cx', point.x); circle.setAttribute('cy', point.y); circle.setAttribute('r', '5'); circle.setAttribute('fill', '#007bff'); circle.setAttribute('stroke', 'white'); circle.setAttribute('stroke-width', '2'); chartSvg.appendChild(circle);
                    const xLabel = document.createElementNS(svgNS, 'text'); xLabel.setAttribute('x', point.x); xLabel.setAttribute('y', svgHeight - padding.bottom + 20); xLabel.setAttribute('text-anchor', 'middle'); xLabel.setAttribute('fill', '#000000ff'); xLabel.setAttribute('font-size', '12'); xLabel.textContent = labels[index]; chartSvg.appendChild(xLabel);
                });
            }
        }

        async function loadContent(page) {
            navLinks.forEach(link => {
                if (link.id !== 'logoutButton') link.classList.remove('active');
            });
            const activeLink = document.querySelector(`[data-page="${page}"]`);
            if (activeLink) activeLink.classList.add('active');
            
            if (page === 'dashboard') {
                drawDashboard();
                return;
            }
            
            const iframePages = ['data_analytics', 'view_orders', 'manage_employees', 'manage_shop', 'view_sales', 'reports'];
            if(iframePages.includes(page)) {
                contentArea.innerHTML = `<iframe src="owner_pages/${page}.php" style="width: 100%; height: 90vh; border: none;"></iframe>`;
                return;
            }

            contentArea.innerHTML = `<h2>${page.replace(/_/g, ' ')}</h2><p>Content for this section is not yet implemented.</p>`;
        }

        navLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                if (link.id === 'logoutButton') {
                    if (confirm('Are you sure you want to logout?')) {
                        localStorage.removeItem('laundroUser');
                        window.location.href = 'index.php';
                    }
                    return;
                }
                const page = link.getAttribute('data-page');
                loadContent(page);
            });
        });
        
        loadContent('dashboard');
    </script>
</body>
</html>