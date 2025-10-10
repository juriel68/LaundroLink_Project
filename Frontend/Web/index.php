<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LaundroLink Login</title>
    <style>
        
        body { 
            margin: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #0D47A1;
            height: 100vh; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
        }

        .login-box {
            background: #89CFF0; 
            padding: 40px; 
            border-radius: 15px; 
            box-shadow: 0px 6px 20px rgba(0,0,0,0.2); 
            width: 350px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .login-box::before, .login-box::after {
            content: "";
            position: absolute;
            width: 200px;
            height: 200px;
            border-radius: 50%;
            z-index: 0;
        }

        .login-box::before {
            top: -80px; right: -80px;
            background: rgba(0, 183, 255, 0.2);
        }

        .login-box::after {
            bottom: -80px; left: -80px;
            background: rgba(173, 216, 230, 0.3);
        }

        .login-box h2 {
            margin-bottom: 20px; 
            color: #0077b6; 
            font-size: 28px; 
            position: relative; 
            z-index: 1;
        }

        .login-box p {
            margin-bottom: 20px; 
            color: #555; 
            font-size: 14px; 
            position: relative; 
            z-index: 1;
        }

        input {
            width: 100%; 
            padding: 12px; 
            margin: 12px 0; 
            border: 1px solid #ccc; 
            border-radius: 8px; 
            font-size: 14px; 
            position: relative; 
            z-index: 1; 
            box-sizing: border-box;
        }

        button {
            width: 100%; 
            padding: 12px; 
            margin-top: 10px; 
            background: #00b4d8; 
            color: white; 
            border: none; 
            border-radius: 8px; 
            cursor: pointer; 
            font-size: 16px; 
            font-weight: bold; 
            position: relative; 
            z-index: 1; 
            transition: background 0.3s ease;
        }

        button:hover { 
            background: #0096c7; 
        }

        .error {
            color: red; 
            font-size: 0.9em; 
            margin-bottom: 10px; 
            position: relative; 
            z-index: 1; 
            display: none; /* Hidden by default */
        }
    </style>
</head>
<body>
    <div class="login-box">
        <h2>LaundroLink</h2>
        <p>Login</p>

        <p id="errorMessage" class="error"></p>

        <form id="loginForm">
            <input type="text" name="email" placeholder="👤 Email" required />
            <input type="password" name="password" placeholder="🔑 Password" required />
            <button type="submit">Login</button>
        </form>
    </div>
    <script type="module">
        // 1. Import the URL from your new module file
        import { API_LOGIN_URL } from './api.js';

        const loginForm = document.getElementById('loginForm');
        const errorMessage = document.getElementById('errorMessage');

        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            errorMessage.style.display = 'none';

            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData.entries());

            try {
                // 2. Use the imported constant directly
                const response = await fetch(API_LOGIN_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    const userRole = result.user.UserRole;
                    if (userRole === 'Admin') {
                        localStorage.setItem('laundroUser', JSON.stringify(result.user));
                        window.location.href = 'admindashboard.php';
                    } else if (userRole === 'Shop Owner') {
                        localStorage.setItem('laundroUser', JSON.stringify(result.user));
                        window.location.href = 'ownerdashboard.php';
                    } else {
                        errorMessage.textContent = 'This portal is for Admins and Owners only.';
                        errorMessage.style.display = 'block';
                    }
                } else {
                    errorMessage.textContent = result.message || 'Invalid credentials.';
                    errorMessage.style.display = 'block';
                }
            } catch (error) {
                errorMessage.textContent = 'Cannot connect to the login server.';
                errorMessage.style.display = 'block';
            }
        });
    </script>
</body>
</html>