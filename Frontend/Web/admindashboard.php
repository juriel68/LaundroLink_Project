<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>LaundroLink Admin Dashboard</title>
    <style>
        body {
            margin: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f0f8ff;
            color: #333;
        }
        .sidebar {
            width: 230px;
            height: 100vh;
            background: linear-gradient(180deg, #0077b6, #0096c7);
            color: white;
            position: fixed;
            top: 0;
            left: 0;
            padding-top: 30px;
            box-shadow: 3px 0 10px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
        }
        .sidebar h2 {
            text-align: center;
            margin-bottom: 40px;
            font-size: 22px;
            letter-spacing: 1px;
        }
        .sidebar-nav {
            flex-grow: 1;
        }
        .sidebar-nav a, .logout-link a {
            display: block;
            color: white;
            padding: 14px 20px;
            margin: 8px 15px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 500;
            transition: background 0.3s ease;
            cursor: pointer;
        }
        .sidebar-nav a:hover, .sidebar-nav a.active, .logout-link a:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        .main-content {
            margin-left: 230px;
            padding: 30px;
            min-height: 100vh;
            background: #f9fbfd;
            box-sizing: border-box;
        }
        .main-content h2 {
            margin-top: 0;
            font-size: 26px;
            color: #0077b6;
        }
        /* --- Dashboard Styles --- */
        .admin-kpi-grid { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 25px; 
            margin-bottom: 40px; 
        }
        .kpi-card { 
            background: white; 
            padding: 25px; 
            border-radius: 12px; 
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05); 
            border-left: 5px solid; 
        }
        .kpi-card h3 { 
            margin: 0 0 5px 0; 
            font-size: 16px; 
            color: #6c757d; 
            font-weight: 500; 
        }
        .kpi-card p { 
            margin: 0; 
            font-size: 36px; 
            font-weight: 700; 
            color: #343a40; 
        }
        .dashboard-header {
            background: white;
            padding: 15px 25px;
            border-radius: 10px;
            margin-bottom: 25px;
            box-shadow: 0px 4px 12px rgba(0,0,0,0.05);
        }
        .dashboard-header h1 {
            margin: 0;
            font-size: 24px;
            color: #0077b6;
        }
        .chart-container { 
            background: white; 
            padding: 25px; 
            border-radius: 12px; 
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05); 
        }
        .container-title { 
            font-size: 20px; 
            font-weight: 600; 
            color: #343a40; 
            margin: 0 0 30px 0; 
        }
        .chart-area { 
            position: relative; 
            width: 100%; 
            height: 350px; 
        }
        .chart-svg { 
            width: 100%; 
            height: 100%; 
        }
        /* --- Bubble Animation --- */
        .bubble {
            position: absolute;
            border-radius: 50%;
            background: rgba(0, 183, 255, 0.15);
            animation: float 6s infinite ease-in-out;
        }
        .bubble.small {
            width: 40px; height: 40px;
            bottom: 20px; right: 30px;
        }
        .bubble.large {
            width: 80px; height: 80px;
            bottom: 100px; right: 100px;
        }
        @keyframes float {
            0% { transform: translateY(0); opacity: 1; }
            50% { transform: translateY(-20px); opacity: 0.7; }
            100% { transform: translateY(0); opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="sidebar">
        <div>
            <h2>🧺 LaundroLink</h2>
            <nav class="sidebar-nav">
                <a data-page="dashboard" class="active">Dashboard</a> 
                <a data-page="manage_users">Manage Users</a>
                <a data-page="monitor_activity">Monitor System Activity</a>
                <a data-page="payment_processing">Payment Processing</a>
                <a data-page="system_settings">System Settings</a>
                <a data-page="data_security">Data Security</a>
                <a data-page="reports">Generate Reports</a>
            </nav>
        </div>
        <div class="logout-link">
            <a id="logoutButton">Logout</a>
        </div>
    </div>

    <div class="main-content" id="content-area">
    </div>

    <div class="bubble small"></div>
    <div class="bubble large"></div>

    <script type="module">
    import { API_BASE_URL } from './api.js';

    // --- INITIAL AUTHENTICATION CHECK ---
    const userJSON = localStorage.getItem('laundroUser');
    if (!userJSON) {
        window.location.href = 'index.php';
        // Prevent further execution if redirecting
        throw new Error('User not logged in or session expired.'); 
    }
    const loggedInUser = JSON.parse(userJSON);
    if (loggedInUser.UserRole !== 'Admin') {
        window.location.href = 'index.php';
        // Prevent further execution if redirecting
        throw new Error('Access denied. User is not Admin.'); 
    }
    
    const contentArea = document.getElementById('content-area');
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const logoutButton = document.getElementById('logoutButton');
    
    // --- ADMIN DASHBOARD FUNCTIONS ---
    
    function drawAdminDashboard() {
        const dashboardHtml = `
            <div class="dashboard-header">
                <h1>Welcome, Admin ${loggedInUser.UserName || ''}!</h1>
            </div>
            <div class="admin-kpi-grid">
                <div class="kpi-card" style="border-color: #007bff;">
                    <h3>Total Shop Owners</h3>
                    <p id="totalOwners">...</p>
                </div>
                <div class="kpi-card" style="border-color: #28a745;">
                    <h3>Active Shops (Last 30 Days)</h3>
                    <p id="activeShops">...</p>
                </div>
                <div class="kpi-card" style="border-color: #ffc107;">
                    <h3>Total Payments Processed</h3>
                    <p id="totalPayments">...</p>
                </div>
                <div class="kpi-card" style="border-color: #17a2b8;">
                    <h3>Total System Users</h3>
                    <p id="totalUsers">...</p>
                </div>
            </div>
            
            <div class="chart-container">
                <h3 class="container-title">System Growth (New Users/Shops - Last 12 Months)</h3>
                <div class="chart-area">
                    <svg class="chart-svg" id="adminChartSvg"></svg>
                </div>
            </div>
            `;
        contentArea.innerHTML = dashboardHtml;
        fetchAdminDashboardData();
    }
    
    async function fetchAdminDashboardData() {
        document.getElementById('totalOwners').textContent = 'Fetching...';
        document.getElementById('activeShops').textContent = 'Fetching...';
        document.getElementById('totalPayments').textContent = 'Fetching...';
        document.getElementById('totalUsers').textContent = 'Fetching...';

        const chartSvg = document.getElementById('adminChartSvg');
        if (chartSvg) {
            chartSvg.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="#adb5bd" font-family="Segoe UI">Loading data...</text>`;
        }
        
        try {
            // Fetching data from the consolidated analytics endpoint
            const response = await fetch(`${API_BASE_URL}/analytics/admin-dashboard-stats`);
            if (!response.ok) throw new Error('Failed to fetch admin dashboard stats');
            
            const data = await response.json();
            
            document.getElementById('totalOwners').textContent = data.totalOwners || '0';
            document.getElementById('activeShops').textContent = data.activeShops || '0';
            document.getElementById('totalPayments').textContent = data.totalPayments || '0';
            document.getElementById('totalUsers').textContent = data.totalUsers || '0';
            
            drawChart(data.chartData); 
            
        } catch (error) {
            console.error("Admin Dashboard fetch error:", error);
            document.getElementById('totalOwners').textContent = 'Error';
            document.getElementById('activeShops').textContent = 'Error';
            document.getElementById('totalPayments').textContent = 'Error';
            document.getElementById('totalUsers').textContent = 'Error';

            if (chartSvg) {
                chartSvg.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="#dc3545" font-family="Segoe UI">Error loading chart data.</text>`;
            }
        }
    }

    // --- CHART DRAWING FUNCTION (SVG logic) ---

    function drawChart(chartData) {
        const chartSvg = document.getElementById('adminChartSvg'); 
        chartSvg.innerHTML = '';
        if (!chartData || chartData.length === 0) {
            chartSvg.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="#adb5bd" font-family="Segoe UI">No growth data for the last 12 months.</text>`;
            return;
        }
        
        const values = chartData.map(d => d.value);
        const labels = chartData.map(d => d.label);
        const maxCount = Math.ceil(Math.max(...values, 1) / 10) * 10 || 10;
        const svgNS = "http://www.w3.org/2000/svg";
        const padding = { top: 20, right: 20, bottom: 60, left: 70 };
        const svgWidth = chartSvg.clientWidth;
        const svgHeight = chartSvg.clientHeight;
        const chartWidth = svgWidth - padding.left - padding.right;
        const chartHeight = svgHeight - padding.top - padding.bottom;

        // Draw grid lines and Y-axis labels
        const numGridLines = 5;
        for (let i = 0; i <= numGridLines; i++) {
            const y = padding.top + (chartHeight / numGridLines) * i;
            const value = maxCount - (maxCount / numGridLines) * i;
            // Horizontal grid line
            const gridLine = document.createElementNS(svgNS, 'line'); 
            gridLine.setAttribute('x1', padding.left); gridLine.setAttribute('y1', y); 
            gridLine.setAttribute('x2', svgWidth - padding.right); gridLine.setAttribute('y2', y); 
            gridLine.setAttribute('stroke', '#5b5e61ff'); gridLine.setAttribute('stroke-dasharray', '3 3'); 
            chartSvg.appendChild(gridLine);
            
            // Y-axis label
            const yLabel = document.createElementNS(svgNS, 'text'); 
            yLabel.setAttribute('x', padding.left - 10); yLabel.setAttribute('y', y + 4); 
            yLabel.setAttribute('text-anchor', 'end'); yLabel.setAttribute('fill', '#1a1b1cff'); 
            yLabel.setAttribute('font-size', '12'); yLabel.textContent = `${value}`; 
            chartSvg.appendChild(yLabel);
        }

        // --- ADD AXIS TITLES ---
        
        // Y-Axis Title
        const yTitle = document.createElementNS(svgNS, 'text');
        yTitle.setAttribute('transform', `rotate(-90)`);
        yTitle.setAttribute('x', -(svgHeight / 2));
        yTitle.setAttribute('y', 20); 
        yTitle.setAttribute('text-anchor', 'middle');
        yTitle.setAttribute('fill', '#000000ff');
        yTitle.setAttribute('font-size', '14');
        yTitle.setAttribute('font-weight', '600');
        yTitle.textContent = 'New Users/Shops Count';
        chartSvg.appendChild(yTitle);

        // X-Axis Title
        const xTitle = document.createElementNS(svgNS, 'text');
        xTitle.setAttribute('x', padding.left + chartWidth / 2);
        xTitle.setAttribute('y', svgHeight - 10); 
        xTitle.setAttribute('text-anchor', 'middle');
        xTitle.setAttribute('fill', '#000000ff');
        xTitle.setAttribute('font-size', '14');
        xTitle.setAttribute('font-weight', '600');
        xTitle.textContent = 'Month of Registration (YYYY-MM)';
        chartSvg.appendChild(xTitle);
        
        // --- DRAW LINE AND AREA ---
        const defs = document.createElementNS(svgNS, 'defs'); 
        const gradient = document.createElementNS(svgNS, 'linearGradient'); 
        gradient.id = 'adminAreaGradient'; 
        gradient.innerHTML = `<stop offset="0%" style="stop-color:#0096c7; stop-opacity:0.4"/><stop offset="100%" style="stop-color:#0096c7; stop-opacity:0"/>`; 
        defs.appendChild(gradient); 
        chartSvg.appendChild(defs);
        
        const points = values.map((value, index) => {
            let pointX;
            
            if (labels.length > 1) {
                // Standard calculation for 2 or more points
                pointX = padding.left + (index / (labels.length - 1)) * chartWidth;
            } else {
                // FIX: If only one point, place it in the center
                pointX = padding.left + chartWidth / 2;
            }

            return { 
                x: pointX, 
                y: padding.top + chartHeight - (value / maxCount) * chartHeight 
            };
        });
        
        // Logic for drawing the line/area (only runs if labels.length > 1)
        if (labels.length > 1) {
            const line = (points) => { 
                let d = `M ${points[0].x} ${points[0].y}`; 
                for (let i = 0; i < points.length - 1; i++) { 
                    const x_mid = (points[i].x + points[i+1].x) / 2; 
                    const cp_x1 = (x_mid + points[i].x) / 2; 
                    d += ` C ${cp_x1},${points[i].y} ${cp_x1},${points[i+1].y} ${points[i+1].x},${points[i+1].y}`; 
                } 
                return d; 
            };
            
            const areaPath = document.createElementNS(svgNS, 'path'); 
            areaPath.setAttribute('d', line(points) + ` L ${svgWidth - padding.right} ${svgHeight - padding.bottom} L ${padding.left} ${svgHeight - padding.bottom} Z`); 
            areaPath.setAttribute('fill', 'url(#adminAreaGradient)');
            chartSvg.appendChild(areaPath);

            const linePath = document.createElementNS(svgNS, 'path'); 
            linePath.setAttribute('d', line(points)); 
            linePath.setAttribute('fill', 'none'); 
            linePath.setAttribute('stroke', '#0096c7'); 
            linePath.setAttribute('stroke-width', '3');
            chartSvg.appendChild(linePath);
        }

        // Draw circles and x-labels for all points (regardless of count)
        points.forEach((point, index) => {
            const circle = document.createElementNS(svgNS, 'circle'); 
            circle.setAttribute('cx', point.x); circle.setAttribute('cy', point.y); 
            circle.setAttribute('r', '5'); circle.setAttribute('fill', '#0096c7'); 
            circle.setAttribute('stroke', 'white'); circle.setAttribute('stroke-width', '2'); 
            chartSvg.appendChild(circle);
            
            const xLabel = document.createElementNS(svgNS, 'text'); 
            xLabel.setAttribute('x', point.x); xLabel.setAttribute('y', svgHeight - padding.bottom + 20); 
            xLabel.setAttribute('text-anchor', 'middle'); xLabel.setAttribute('fill', '#000000ff'); 
            xLabel.setAttribute('font-size', '12'); 
            // Show only MM part, or the full label if only one point
            xLabel.textContent = labels[index].replace(/^\d{4}-/, ''); 
            chartSvg.appendChild(xLabel);
        });
    }

    // --- NAVIGATION AND INITIAL LOAD ---

    async function loadContent(page) {
        navLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`[data-page="${page}"]`);
        if (activeLink) activeLink.classList.add('active');
        
        contentArea.innerHTML = ''; 

        if (page === 'dashboard') {
            drawAdminDashboard(); 
            return;
        }

        const iframePages = ['manage_users', 'monitor_activity', 'payment_processing', 'system_settings', 'data_security', 'reports'];
        if (iframePages.includes(page)) {
            const iframe = document.createElement('iframe');
            iframe.src = `admin_pages/${page}.php`;
            iframe.style.width = '100%';
            iframe.style.height = '90vh';
            iframe.style.border = 'none';
            iframe.style.borderRadius = '12px';
            iframe.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.05)';
            contentArea.appendChild(iframe);
            return; 
        }
        
        contentArea.innerHTML = `<h2>${page.replace(/_/g, ' ')}</h2><p>Content not yet implemented for ${page}.</p>`;
    }

    // --- EVENT LISTENERS ---

    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const page = link.getAttribute('data-page');
            if (page) {
                loadContent(page);
            }
        });
    });

    logoutButton.addEventListener('click', (event) => {
        event.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('laundroUser');
            window.location.href = 'index.php';
        }
    });

    // Handle messages from iframes (if any are used to navigate)
    window.addEventListener('message', (event) => {
        if (event.data.type === 'loadPage') {
            loadContent(event.data.page);
        }
    });

    // Initial page load
    loadContent('dashboard'); 
    </script>
</body>
</html>