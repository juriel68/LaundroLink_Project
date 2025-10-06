<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>LaundroLink Owner Dashboard</title>
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
            flex-grow: 1; /* Allows the nav to take up available space */
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
            if (user.UserRole !== 'Shop Owner') {
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
                <a data-page="manage_shop">Manage Shop Details</a>
                <a data-page="view_orders">View Orders</a>
                <a data-page="manage_employees">Manage Employees</a>
                <a data-page="view_sales">View Sales</a>
                <a data-page="reports">Generate Reports</a>
                <a data-page="reviews">View Customer Reviews</a>
            </nav>
        </div>
        <div class="logout-link">
            <a id="logoutButton">Logout</a>
        </div>
    </div>

    <div class="main-content">
        <div class="dashboard-header">
            <h1 id="welcomeMessage"></h1>
        </div>
        <div class="content" id="content-area">
            </div>
    </div>

    <div class="bubble small"></div>
    <div class="bubble large"></div>

    <script type="module">
        import { API_BASE_URL } from './api.js';

        const contentArea = document.getElementById('content-area');
        const welcomeMessage = document.getElementById('welcomeMessage');
        const navLinks = document.querySelectorAll('.sidebar-nav a');
        const logoutButton = document.getElementById('logoutButton');
        
        const loggedInUser = JSON.parse(localStorage.getItem('laundroUser'));

        welcomeMessage.textContent = `Welcome, ${loggedInUser.ShopName || 'Owner'}!`;
        
        async function loadContent(page) {
            navLinks.forEach(link => link.classList.remove('active'));
            const activeLink = document.querySelector(`[data-page="${page}"]`);
            if (activeLink) activeLink.classList.add('active');
            
            contentArea.innerHTML = '<h2>Loading...</h2>';

            try {
                let htmlContent = '';
                switch (page) {
                    case 'manage_shop':
                        htmlContent = `<h2>Manage Shop Details</h2><p>Content for managing shop details goes here.</p>`;
                        break;
                    case 'view_orders':
                        const response = await fetch(`${API_BASE_URL}/orders/shop/${loggedInUser.ShopID}`);
                        if (!response.ok) throw new Error('Failed to fetch orders');
                        const orders = await response.json();
                        
                        let orderRows = orders.map(order => `
                            <tr>
                                <td>${order.OrderID || ''}</td>
                                <td>${order.CustomerName || 'N/A'}</td>
                                <td>${order.TotalAmount || '0.00'}</td>
                                <td>${order.Status || 'Unknown'}</td>
                            </tr>
                        `).join('');

                        htmlContent = `
                            <h2>Shop Orders</h2>
                            <table border="1" style="width:100%; border-collapse: collapse;">
                                <thead><tr><th>ID</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
                                <tbody>${orderRows}</tbody>
                            </table>`;
                        break;
                    case 'manage_employees':
                        htmlContent = `<h2>Manage Employees</h2><p>Employee management features will be displayed here.</p>`;
                        break;
                    case 'view_sales':
                        htmlContent = `<h2>View Sales</h2><p>Sales data and analytics will be displayed here.</p>`;
                        break;
                    case 'reports':
                        htmlContent = `<h2>Generate Reports</h2><p>Reporting features will be displayed here.</p>`;
                        break;
                    case 'reviews':
                        htmlContent = `<h2>Customer Reviews</h2><p>Customer reviews and ratings will be displayed here.</p>`;
                        break;
                    default:
                        htmlContent = `<h2>Welcome to the Owner Dashboard</h2><p>Select an option from the sidebar.</p>`;
                }
                contentArea.innerHTML = htmlContent;
            } catch (error) {
                console.error('Failed to load content:', error);
                contentArea.innerHTML = '<h2>Error</h2><p>Could not load content from the server.</p>';
            }
        }

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
        
        // Load initial welcome content
        loadContent('welcome');
    </script>
</body>
</html>