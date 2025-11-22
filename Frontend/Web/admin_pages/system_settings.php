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

    <script type="module">
        // 🔑 FIX: Correct relative path to api.js
        import { API_BASE_URL } from '../api.js';

        const maintenanceCheckbox = document.getElementById('maintenanceMode');
        
        // Define endpoints
        const STATUS_ENDPOINT = `${API_BASE_URL}/admin/config/maintenance-status`;
        const SET_ENDPOINT = `${API_BASE_URL}/admin/config/set-maintenance`;

        // --- 1. Retrieve Current User ID ---
        const loggedInUser = JSON.parse(localStorage.getItem('laundroUser'));
        const userId = loggedInUser ? loggedInUser.UserID : null;

        // --- 2. Load Initial Setting ---
        async function loadSettings() {
            try {
                const response = await fetch(STATUS_ENDPOINT);
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (typeof data.maintenanceMode === 'boolean') {
                    maintenanceCheckbox.checked = data.maintenanceMode;
                }
            } catch (error) {
                console.error("Could not load initial settings:", error);
                maintenanceCheckbox.disabled = true;
                alert("Error loading initial settings from backend. Check console for details.");
            }
        }

        // --- 3. Update Setting in Backend with Logging ---
        async function updateMaintenanceMode(isEnabled) {
            try {
                const response = await fetch(SET_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    // 🔑 UPDATED: Send userId in body so backend can log the activity
                    body: JSON.stringify({ 
                        enable: isEnabled,
                        userId: userId 
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    alert(data.message);
                    return true; 
                } else { 
                    alert(`Failed to update setting: ${data.message}`);
                    return false; 
                }
            } catch (error) {
                console.error("Update failed:", error);
                alert("Error connecting to backend or saving setting.");
                return false; 
            }
        }

        // --- 4. Event Listener ---
        maintenanceCheckbox.addEventListener('change', async () => {
            const newStatus = maintenanceCheckbox.checked;
            let shouldProceed = true;

            if (newStatus) {
                shouldProceed = confirm("Are you sure you want to ACTIVATE App Maintenance Mode? This will affect all users.");
            } 
            
            if (shouldProceed) {
                const success = await updateMaintenanceMode(newStatus);
                
                // If backend update failed, revert UI state
                if (!success) {
                    maintenanceCheckbox.checked = !newStatus; 
                }
            } else {
                // User cancelled, revert UI state
                maintenanceCheckbox.checked = !newStatus;
            }
        });

        // Load settings when the page is ready
        document.addEventListener('DOMContentLoaded', loadSettings);
    </script>
</body>
</html>