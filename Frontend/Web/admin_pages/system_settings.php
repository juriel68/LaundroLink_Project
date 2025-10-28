<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>System Settings</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #b3e5fc;
            margin: 0;
            padding: 40px;
        }

        .settings-container {
            background: white;
            border-radius: 10px;
            box-shadow: 0px 4px 10px rgba(0,0,0,0.1);
            max-width: 600px;
            margin: 0 auto;
            padding: 25px 35px;
            text-align: center;
        }

        .settings-container h2 {
            color: #1565c0;
            font-size: 24px;
            margin-bottom: 10px;
        }

        .settings-container p {
            color: #333;
            margin-bottom: 30px;
        }

        .setting-item {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            font-size: 16px;
            color: #333;
        }

        .setting-item label {
            font-weight: 500;
        }

        input[type="checkbox"] {
            transform: scale(1.3);
            cursor: pointer;
        }

        .footer {
            margin-top: 30px;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="settings-container">
        <h2>System Settings</h2>
        <p>Configure system preferences and parameters.</p>

        <div class="setting-item">
            <label for="maintenanceMode">App Maintenance Mode:</label>
            <input type="checkbox" id="maintenanceMode">
            <span>Enable</span>
        </div>

        <div class="footer">
            <p>&copy; 2025 LaundroLink</p>
        </div>
    </div>

    <script>
        const maintenanceCheckbox = document.getElementById('maintenanceMode');

        maintenanceCheckbox.addEventListener('change', () => {
            if (maintenanceCheckbox.checked) {
                const confirmActivate = confirm("Are you sure you want to activate Maintenance Mode?");
                if (!confirmActivate) {
                    maintenanceCheckbox.checked = false;
                } else {
                    alert("Maintenance Mode activated (no backend functionality yet).");
                }
            } else {
                alert("Maintenance Mode deactivated (no backend functionality yet).");
            }
        });
    </script>
</body>
</html>
