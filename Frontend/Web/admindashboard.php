<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>LaundroLink Admin Dashboard</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
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
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
            gap: 25px; 
            margin-bottom: 40px; 
            margin-top: 30px;
        }
        .kpi-card { 
            background: white; 
            padding: 25px; 
            border-radius: 12px; 
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05); 
            border-left: 5px solid; 
            cursor: pointer; 
            transition: transform 0.2s;
        }
        .kpi-card:hover {
            transform: translateY(-5px);
        }
        .kpi-card h3 { 
            margin: 0 0 10px 0; 
            font-size: 18px; 
            color: #343a40; 
            font-weight: 600; 
        }
        .kpi-card p { 
            margin: 0 0 15px 0; 
            font-size: 14px; 
            color: #6c757d;
        }
        .kpi-card i {
            margin-right: 8px;
        }
        .kpi-card a {
            display: inline-block;
            text-decoration: none;
            font-weight: 600; 
            transition: color 0.2s;
        }
        .dashboard-header {
            background: white;
            padding: 25px 30px;
            border-radius: 10px;
            margin-bottom: 25px;
            box-shadow: 0px 4px 12px rgba(0,0,0,0.05);
        }
        .dashboard-header h1 {
            margin: 0;
            font-size: 28px;
            color: #0077b6;
        }
        .dashboard-header p {
            margin: 5px 0 0 0;
            color: #6c757d;
            font-size: 16px;
        }
        /* --- Bubble Animation --- */
        .bubble {
            position: absolute;
            border-radius: 50%;
            background: rgba(0, 183, 255, 0.15);
            animation: float 6s infinite ease-in-out;
            z-index: 0;
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
                <a data-page="dashboard" class="active"><i class="fas fa-home"></i> Dashboard</a> 
                <a data-page="manage_users"><i class="fas fa-users"></i> Manage Users</a>
                <a data-page="monitor_activity"><i class="fas fa-desktop"></i> Monitor System Activity</a>
                <a data-page="payment_processing"><i class="fas fa-dollar-sign"></i> Payment Processing</a>
                <a data-page="system_settings"><i class="fas fa-cog"></i> System Settings</a>
                <a data-page="data_security"><i class="fas fa-shield-alt"></i> Data Security</a>
                <a data-page="reports"><i class="fas fa-file-invoice-dollar"></i> Generate Reports</a>
                <a data-page="analytics"><i class="fas fa-chart-area"></i> Data Analytics</a>
            </nav>
        </div>
        <div class="logout-link">
            <a id="logoutButton"><i class="fas fa-sign-out-alt"></i> Logout</a>
        </div>
    </div>

    <div class="main-content" id="content-area">
    </div>

    <div class="bubble small"></div>
    <div class="bubble large"></div>

    <script type="module">
    // --- INITIAL AUTHENTICATION CHECK ---
    const userJSON = localStorage.getItem('laundroUser');
    if (!userJSON) {
        window.location.href = 'index.php';
        throw new Error('User not logged in or session expired.'); 
    }
    const loggedInUser = JSON.parse(userJSON);
    if (loggedInUser.UserRole !== 'Admin') {
        window.location.href = 'index.php';
        throw new Error('Access denied. User is not Admin.'); 
    }
    
    const contentArea = document.getElementById('content-area');
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const logoutButton = document.getElementById('logoutButton');
    
    // --- ADMIN DASHBOARD FUNCTIONS (Static Nav Hub) ---
    
    function drawAdminDashboard() {
        const dashboardHtml = `
            <div class="dashboard-header">
                <h1>Welcome to the LaundroLink Admin Control Panel!</h1>
                <p>Use the navigation links in the sidebar or below to manage the platform.</p>
            </div>
            
            <div class="admin-kpi-grid">
                
                <div class="kpi-card" style="border-color: #007bff;" data-page-nav="reports">
                    <h3><i class="fas fa-file-invoice-dollar"></i> Generate Reports</h3>
                    <p>Analyze revenue, orders, and shop performance metrics for specific periods.</p>
                    <a href="#" style="color:#007bff;">View Operational Reports »</a>
                </div>
                
                <div class="kpi-card" style="border-color: #28a745;" data-page-nav="analytics">
                    <h3><i class="fas fa-chart-area"></i> Data Analytics</h3>
                    <p>Access historical growth trends, shop acquisition, and service gap analysis.</p>
                    <a href="#" style="color:#28a745;">View Strategic Insights »</a>
                </div>
                
                <div class="kpi-card" style="border-color: #ffc107;" data-page-nav="manage_users">
                    <h3><i class="fas fa-users-cog"></i> Manage Users</h3>
                    <p>Review and administer accounts for customers, staff, and shop owners.</p>
                    <a href="#" style="color:#ffc107;">Go to User Management »</a>
                </div>
                
                <div class="kpi-card" style="border-color: #17a2b8;" data-page-nav="system_settings">
                    <h3><i class="fas fa-cogs"></i> System Settings</h3>
                    <p>Toggle maintenance mode, manage configuration values, and system parameters.</p>
                    <a href="#" style="color:#17a2b8;">Configure System »</a>
                </div>
                
            </div>
            `;
        contentArea.innerHTML = dashboardHtml;
        
        // Add event listeners to the new cards inside the dashboard area
        document.querySelectorAll('.admin-kpi-grid .kpi-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.tagName !== 'A') {
                    const page = card.getAttribute('data-page-nav');
                    if (page) loadContent(page);
                }
            });
            const link = card.querySelector('a');
            if (link) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    loadContent(card.getAttribute('data-page-nav'));
                });
            }
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

        const iframePages = ['manage_users', 'monitor_activity', 'payment_processing', 'system_settings', 'data_security', 'reports', 'analytics'];
        if (iframePages.includes(page)) {
            const iframe = document.createElement('iframe');
            iframe.src = `admin_pages/${page}.php`;
            iframe.style.width = '100%';
            iframe.style.height = '85vh'; // Adjusted height slightly for better fit
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
    
    // Initial page load
    loadContent('dashboard'); 
    </script>
</body>
</html>