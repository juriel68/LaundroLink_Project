<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Manage Users</title>
    <style>
        /* Your original CSS styles are preserved here */
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f9fbfd; /* Match dashboard content background */
            padding: 20px;
            margin: 0;
        }
        .page-title {
            font-size: 26px;
            color: #0077b6;
            margin-bottom: 20px;
        }
        .table-container {
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0px 4px 12px rgba(0,0,0,0.05);
            overflow-x: auto;
        }
        .styled-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
            min-width: 800px;
        }
        .styled-table thead tr {
            background: #0096c7;
            color: #ffffff;
            text-align: left;
        }
        .styled-table th, 
        .styled-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #ddd;
        }
        .styled-table tbody tr:nth-child(even) {
            background-color: #f3f9fb;
        }
        .styled-table tbody tr:hover {
            background-color: #e6f7ff;
        }
        .inline-form {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .role-select {
            padding: 6px;
            border: 1px solid #ccc;
            border-radius: 6px;
            font-size: 13px;
        }
        .btn {
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 13px;
            cursor: pointer;
            transition: background 0.3s ease;
        }
        .update-btn {
            background: #0077b6;
            color: white;
        }
        .update-btn:hover {
            background: #005f87;
        }
        .delete-btn {
            background: #e63946;
            color: white;
        }
        .delete-btn:hover {
            background: #c1121f;
        }
        .status {
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: capitalize;
        }
        .status.active {
            background: #d1f7c4;
            color: #2a9d8f;
        }
        .status.inactive {
            background: #ffe0e0;
            color: #d62828;
        }
    </style>
</head>
<body>

    <h2 class="page-title">👥 Manage Users</h2>
    <div class="table-container">
        <table class="styled-table">
            <thead>
                <tr>
                    <th>UserID</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="users-table-body">
                </tbody>
        </table>
    </div>

    <script type="module">
        // Note the path to api.js is now './api.js' since they are in the same 'pages' folder level
        import { API_BASE_URL } from '../api.js';

        const tableBody = document.getElementById('users-table-body');

        function renderTable(users) {
            if (!users || users.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4">No users found.</td></tr>';
                return;
            }

            tableBody.innerHTML = users.map(user => `
                <tr data-user-id="${user.UserID}">
                    <td>${user.UserID}</td>
                    <td>${user.UserEmail}</td>
                    <td>
                        <div class="inline-form">
                            <select class="role-select">
                                <option value="Customer" ${user.UserRole === 'Customer' ? 'selected' : ''}>Customer</option>
                                <option value="Staff" ${user.UserRole === 'Staff' ? 'selected' : ''}>Staff</option>
                                <option value="Shop Owner" ${user.UserRole === 'Shop Owner' ? 'selected' : ''}>Shop Owner</option>
                                <option value="Admin" ${user.UserRole === 'Admin' ? 'selected' : ''}>Admin</option>
                            </select>
                            <button class="btn update-btn">Update</button>
                        </div>
                    </td>
                    <td>
                        <div class="inline-form">
                            <button class="btn delete-btn">Delete</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        function attachEventListeners() {
            document.querySelectorAll('.update-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const row = e.target.closest('tr');
                    const userId = row.dataset.userId;
                    const newRole = row.querySelector('.role-select').value;

                    if (confirm(`Change this user's role to ${newRole}?`)) {
                        try {
                            const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ role: newRole })
                            });
                            const result = await response.json();
                            alert(result.message);
                            if (response.ok) fetchUsers();
                        } catch (err) {
                            alert('Error: Could not update role.');
                        }
                    }
                });
            });

            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const userId = e.target.closest('tr').dataset.userId;
                    if (confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
                        try {
                            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                                method: 'DELETE'
                            });
                            const result = await response.json();
                            alert(result.message);
                            if (response.ok) fetchUsers();
                        } catch (err) {
                            alert('Error: Could not delete user.');
                        }
                    }
                });
            });
        }

        async function fetchUsers() {
            tableBody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
            try {
                const response = await fetch(`${API_BASE_URL}/users`);
                if (!response.ok) throw new Error('Failed to fetch users');
                const users = await response.json();
                renderTable(users);
                attachEventListeners();
            } catch (error) {
                console.error('Fetch Users Error:', error);
                tableBody.innerHTML = '<tr><td colspan="4">Error loading users from the server.</td></tr>';
            }
        }

        fetchUsers();
    </script>
</body>
</html>