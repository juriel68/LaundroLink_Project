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
      background: linear-gradient(180deg, #0077b6, #004aad);
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      overflow: hidden;
    }

    /* ==== BRAND TITLE ==== */
    .brand-title {
      font-size: 36px;
      font-weight: 600;
      color: #caf0f8;
      letter-spacing: 2px;
      margin-bottom: 20px;
    }

    /* ==== LOGIN BOX ==== */
    .login-box {
      background: #89CFF0;
      padding: 45px ;
      border-radius: 25px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
      width: 345px;
      text-align: center;
      gap: 18px;
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
     background-color: #f9fcff; /* subtle focus highlight */
    }

    /* ==== BUTTON ==== */
    button {
     width: 100%;
     padding: 12px 14px;          /* Slightly more horizontal space */
     margin-top: 16px;            /* More breathing room above button */
     background: #004aad;
     color: #fff;
     border: none;
     border-radius: 8px;          /* Matches input field curvature */
     cursor: pointer;
     font-size: 15px;
     font-weight: 600;
     transition: background 0.3s ease, transform 0.2s ease;
    }
    button:hover {
      background: #003c8a;
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
    import { API_LOGIN_URL } from './api.js';
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      errorMessage.style.display = 'none';

      const formData = new FormData(loginForm);
      const data = Object.fromEntries(formData.entries());

      try {
        const response = await fetch(API_LOGIN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          const userRole = result.user.UserRole;
          localStorage.setItem('laundroUser', JSON.stringify(result.user));

          if (userRole === 'Admin') {
            window.location.href = 'admindashboard.php';
          } else if (userRole === 'Shop Owner') {
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
