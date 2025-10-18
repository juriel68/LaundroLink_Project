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
        .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: white;
            padding: 15px 25px;
            border-radius: 10px;
            margin-bottom: 25px;
            box-shadow: 0px 4px 12px rgba(0,0,0,0.05);
        }
        .dashboard-header h1 {
            margin: 0;
            font-size: 22px;
            color: #0077b6;
        }
        .dashboard-header .logout-btn {
            background: #e63946;
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.3s ease;
        }
        .dashboard-header .logout-btn:hover {
            background: #d62828;
        }
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

    <script>
        const userJSON = localStorage.getItem('laundroUser');
        if (!userJSON) {
            window.location.href = 'index.php';
        } else {
            const user = JSON.parse(userJSON);
            if (user.UserRole !== 'Admin') {
                window.location.href = 'index.php';
            }
        }
    </script>
</head>
<body>
    <div class="sidebar">
        <div>
            <h2>🧺 LaundroLink</h2>
            <nav class="sidebar-nav">
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

    const contentArea = document.getElementById('content-area');
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const logoutButton = document.getElementById('logoutButton');

    async function loadContent(page) {
        navLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`[data-page="${page}"]`);
        if (activeLink) activeLink.classList.add('active');
        
        contentArea.innerHTML = ''; // Clear previous content

        // *** THIS IS THE CORRECTED LOGIC ***
        // Both pages are now loaded inside an iframe
        if (['create_owner', 'manage_users', 'monitor_activity', 'payment_processing', 'system_settings', 'data_security', 'reports'].includes(page)) {
        const iframe = document.createElement('iframe');
        iframe.src = `pages/${page}.php`;
        iframe.style.width = '100%';
        iframe.style.height = '90vh';
        iframe.style.border = 'none';
        contentArea.appendChild(iframe);
        return; 
    }
        
    }

    // The rest of your script (event listeners) remains the same
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const page = link.getAttribute('data-page');
            loadContent(page);
        });
    });

    logoutButton.addEventListener('click', (event) => {
        event.preventDefault();
        localStorage.removeItem('laundroUser');
        window.location.href = 'index.php';
    });

    window.addEventListener('message', (event) => {
        if (event.data.type === 'loadPage') {
            loadContent(event.data.page);
        }
    });

</script>
</body>
</html>