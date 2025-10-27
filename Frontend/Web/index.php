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

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      errorMessage.style.display = 'none';

      const formData = new FormData(loginForm);
      const data = Object.fromEntries(formData.entries());

      try {
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
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
