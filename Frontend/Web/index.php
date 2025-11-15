<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LaundroLink Login</title>
    <style>
        
        /* ==== BACKGROUND ==== */
        body {
            margin: 0;
            font-family: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(120deg, #95dafaff, #87caecff, #65baecff, #399fdeff);
            background-size: 300% 300%;
            animation: gradientShift 12s ease infinite;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            position: relative;
        }

        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        /* ==== FLOATING BUBBLES ==== */
        .bubbles {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            z-index: 0;
        }

        .bubble {
            position: absolute;
            bottom: -150px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.7);
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.6),
                        0 0 25px rgba(173, 216, 230, 0.5);
            animation: floatUpSideways linear infinite;
            mix-blend-mode: screen;
        }

        @keyframes floatUpSideways {
            0% {
                transform: translate(0, 0) scale(1);
                opacity: 1;
            }
            25% {
                transform: translateX(15px) translateY(-25vh) scale(1.05);
            }
            50% {
                transform: translateX(-20px) translateY(-50vh) scale(1.1);
            }
            75% {
                transform: translateX(10px) translateY(-75vh) scale(1.2);
            }
            100% {
                transform: translateX(-10px) translateY(-110vh) scale(1.3);
                opacity: 0;
            }
        }


        /* ==== BRAND TITLE ==== */
        .brand-title {
            font-size: 36px;
            font-weight: 600;
            color: #ffffff;
            letter-spacing: 2px;
            margin-bottom: 65px;
            z-index: 1;
        }

        /* ==== LOGIN BOX ==== */
        .login-box {
            background: #89CFF0;
            padding: 50px ;
            border-radius: 25px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
            width: 350px;
            text-align: center;
            gap: 18px;
            margin-top: -63px;
            z-index: 1;
        }

        /* ==== AVATAR ==== */
        .avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-color: #e1f5fe;
            border: 2px solid #0077b6;
            overflow: hidden;
            margin: 0 auto 20px auto;
        }

        .avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        /* ==== LABELS ==== */
        label {
            display: block;
            text-align: left;
            font-size: 13px;
            color: #003566;
            font-weight: 600;
            margin-top: 8px;
            margin-bottom: 6px; 
        }

        /* ==== INPUT FIELDS ==== */
        input {
            width: 100%;
            padding: 12px 14px;
            border: none;
            border-radius: 8px;
            font-size: 15px;
            box-sizing: border-box;
            background: #fff;
            margin-bottom: 18px;
            box-shadow: inset 0 1.5px 3px rgba(0, 0, 0, 0.08);
            transition: all 0.2s ease-in-out;
        }

        input:focus {
            outline: none;
            box-shadow: 0 0 0 2px #0077b6, inset 0 2px 4px rgba(0, 0, 0, 0.1);
            background-color: #f9fcff; 
        }

        /* ==== BUTTON ==== */
        button {
            width: 100%;
            padding: 12px 14px; 
            margin-top: 16px; 
            background: #004aad;
            color: #fff;
            border: none;
            border-radius: 8px; 
            cursor: pointer;
            font-size: 15px;
            font-weight: 600;
            transition: background 0.3s ease, transform 0.2s ease;
            margin-bottom: 15px;
        }

        button:hover:not(:disabled) {
            background: #003c8a;
        }

        button:disabled {
            background: #a0a0a0;
            cursor: not-allowed;
        }

        /* ==== ERROR MESSAGE ==== */
        .error {
            color: #ff4d4d;
            font-size: 0.9em;
            margin-top: 10px;
            display: none;
        }
    </style>
</head>

<body>
    <div class="bubbles">
        <div class="bubble" style="left: 5%; width: 30px; height: 30px; animation-duration: 11s; animation-delay: 0s;"></div>
        <div class="bubble" style="left: 20%; width: 45px; height: 45px; animation-duration: 14s; animation-delay: 2s;"></div>
        <div class="bubble" style="left: 35%; width: 25px; height: 25px; animation-duration: 10s; animation-delay: 1s;"></div>
        <div class="bubble" style="left: 50%; width: 40px; height: 40px; animation-duration: 13s; animation-delay: 3s;"></div>
        <div class="bubble" style="left: 65%; width: 20px; height: 20px; animation-duration: 9s; animation-delay: 4s;"></div>
        <div class="bubble" style="left: 80%; width: 35px; height: 35px; animation-duration: 12s; animation-delay: 1s;"></div>
        <div class="bubble" style="left: 90%; width: 25px; height: 25px; animation-duration: 15s; animation-delay: 2s;"></div>
    </div>


    <h1 class="brand-title">LaundroLink</h1>

    <div class="login-box">
        <div class="avatar">
            <img src="https://cdn-icons-png.flaticon.com/512/149/149071.png" alt="User Avatar">
        </div>

        <form id="loginForm">
            <label for="email">EMAIL</label>
            <input type="text" id="email" name="email" placeholder="Enter your email" required />

            <label for="password">PASSWORD</label>
            <input type="password" id="password" name="password" placeholder="Enter your password" required />

            <button type="submit">Log In</button>
            <p id="errorMessage" class="error"></p>
        </form>
    </div>

    <script type="module">
        import { API_BASE_URL } from './api.js';
        const loginForm = document.getElementById('loginForm');
        const errorMessage = document.getElementById('errorMessage');
        const loginButton = loginForm.querySelector('button[type="submit"]');

        const MAINTENANCE_STATUS_ENDPOINT = `${API_BASE_URL}/admin/config/maintenance-status`;

        // **MODIFIED:** Checks maintenance mode based on response.ok (200 status) OR JSON content.
        // Returns true if maintenance is ON or status is undeterminable (network error).
        async function checkMaintenanceStatus() {
            try {
                const response = await fetch(MAINTENANCE_STATUS_ENDPOINT);
                
                // If response is NOT ok (e.g., 503, 500, 403, 404), something is wrong.
                // Since this endpoint is designed to return 200 when OFF and 503 when ON,
                // we treat NOT 200 as a maintenance indicator or critical failure.
                if (!response.ok) {
                    // For the Shop Owner, we treat non-200 success as maintenance is active
                    // (This catches the 503 status, or other server failures)
                    return true; 
                }

                // If response.ok (Status 200), we must check the body for confirmation (Admin style)
                try {
                    const data = await response.json();
                    if (typeof data.maintenanceMode === 'boolean' && data.maintenanceMode === true) {
                        return true; // Maintenance is ON (Confirmed by JSON)
                    }
                } catch (e) {
                    // If parsing JSON fails but status was 200, assume OFF to be safe
                }
                
                return false; // Maintenance is OFF (Confirmed by 200 status and/or JSON data)
                
            } catch (error) {
                // Network error (server unreachable) means we cannot confirm operational status.
                // For a non-admin user (Shop Owner), this must trigger the block (return true).
                return true; 
            }
        }


        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            errorMessage.style.display = 'none';

            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData.entries());

            try {
                // 1. Attempt Login
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                
                if (!response.ok && response.status !== 401) {
                    // Handle non-401 authentication errors (e.g., 500)
                    throw new Error("Server error during login. Status: " + response.status);
                }

                const result = await response.json();

                // 2. Handle successful login
                if (response.ok && result.success) {
                    const userRole = result.user.UserRole;
                    localStorage.setItem('laundroUser', JSON.stringify(result.user));

                    if (userRole === 'Admin') {
                        // Admin gets access regardless of maintenance status
                        window.location.href = 'admindashboard.php';
                        
                    } else if (userRole === 'Shop Owner') {
                        
                        // 3. Shop Owner (non-admin) Maintenance Check:
                        const isMaintenanceActive = await checkMaintenanceStatus();
                        
                        if (isMaintenanceActive) {
                            // Redirect Shop Owner to maintenance page
                            window.location.href = 'maintenancemode.php';
                        } else {
                            // Allow Shop Owner access
                            window.location.href = 'ownerdashboard.php';
                        }
                    } else {
                        // Other roles (Staff/Customer) are blocked from this portal
                        errorMessage.textContent = 'This portal is for Admins and Owners only.';
                        errorMessage.style.display = 'block';
                    }
                    
                } else {
                    // Login failed (e.g., Invalid credentials or backend message)
                    errorMessage.textContent = result.message || 'Invalid credentials.';
                    errorMessage.style.display = 'block';
                }
            } catch (error) {
                // This catch handles network errors on the initial /auth/login call
                errorMessage.textContent = 'Cannot connect to the login server.';
                errorMessage.style.display = 'block';
            }
        });
    </script>
</body>
</html>