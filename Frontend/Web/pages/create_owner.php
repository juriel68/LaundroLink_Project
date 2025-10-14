<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Create Owner Account</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #74ebd5 0%, #ACB6E5 100%);
            /* height: 100vh; */ /* Removed to allow content to scroll if needed */
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .form-container {
            background: #fff;
            padding: 30px 40px;
            border-radius: 15px;
            box-shadow: 0px 6px 20px rgba(0,0,0,0.2);
            width: 500px;
            max-width: 95%;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .form-container::before {
            content: "";
            position: absolute;
            top: -80px;
            right: -80px;
            width: 200px;
            height: 200px;
            background: rgba(0, 183, 255, 0.15);
            border-radius: 50%;
            z-index: 0;
        }
        .form-container::after {
            content: "";
            position: absolute;
            bottom: -80px;
            left: -80px;
            width: 200px;
            height: 200px;
            background: rgba(173, 216, 230, 0.2);
            border-radius: 50%;
            z-index: 0;
        }
        h2 {
            margin-bottom: 20px;
            color: #0077b6;
            font-size: 26px;
            position: relative;
            z-index: 1;
        }
        form {
            position: relative;
            z-index: 1;
            text-align: left;
        }
        label {
            font-weight: bold;
            font-size: 14px;
            color: #333;
        }
        input {
            width: 100%;
            padding: 12px;
            margin: 8px 0 16px 0;
            border: 1px solid #ccc;
            border-radius: 8px;
            font-size: 14px;
            box-sizing: border-box;
        }
        button {
            width: 100%;
            padding: 12px;
            background: #00b4d8;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            transition: background 0.3s ease;
        }
        button:hover {
            background: #0096c7;
        }
    </style>
</head>
<body>
    <div class="form-container">
        <h2>🧺 Create Owner Account</h2>
        <form id="createOwnerForm">
            <label>Full Name:</label>
            <input type="text" name="OwnerName" required>

            <label>Email:</label>
            <input type="email" name="UserEmail" required>

            <label>Password:</label>
            <input type="password" name="UserPassword" required>
            
            <label>Address:</label>
            <input type="text" name="OwnerAddress">

            <label>Contact Phone:</label>
            <input type="text" name="OwnerPhone">

            <button type="submit">➕ Create Owner</button>
        </form>
    </div>

    <script type="module">
        import { API_BASE_URL } from './api.js';

        const form = document.getElementById('createOwnerForm');

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch(`${API_BASE_URL}/users/owner`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                const result = await response.json();

                if (response.ok) {
                    alert('✅ Owner account created successfully!');
                    // This sends a message to the parent window (the dashboard)
                    // telling it to reload the 'manage_users' page.
                    window.parent.postMessage({ type: 'loadPage', page: 'manage_users' }, '*');
                } else {
                    alert(`❌ Error: ${result.message}`);
                }
            } catch (error) {
                alert('❌ An error occurred. Could not connect to the server.');
            }
        });
    </script>
</body>
</html>