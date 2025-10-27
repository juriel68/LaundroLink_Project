<div class="monitor-activity-container">
    <h2>Monitor Activity</h2>
    <p>Track user actions and activity logs within the system.</p>

    <table>
        <thead>
            <tr>
                <th>Time</th>
                <th>User</th>
                <th>Activity</th>
            </tr>
        </thead>
        <tbody id="activity-log-body">
            <tr><td colspan="3">Loading activity logs...</td></tr>
        </tbody>
    </table>
</div>

<style>
    /* Ensure the container is styled for dashboard look and feel */
    .monitor-activity-container {
        padding: 20px;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        max-width: 800px;
        margin: 40px auto; /* Centered content area */
    }
    
    .monitor-activity-container h2 {
        color: #0077b6;
        font-size: 24px;
        margin-bottom: 5px;
    }

    .monitor-activity-container p {
        color: #555;
        margin-bottom: 20px;
    }

    /* Table styles */
    .monitor-activity-container table {
        width: 100%;
        border-collapse: collapse;
        border-radius: 8px;
        overflow: hidden;
    }

    .monitor-activity-container th, .monitor-activity-container td {
        padding: 12px 16px;
        text-align: left;
        border-bottom: 1px solid #ddd;
    }

    .monitor-activity-container th {
        background-color: #0077b6;
        color: #fff;
        font-weight: 600;
    }

    .monitor-activity-container tr:hover {
        background-color: #f2f6ff;
    }

    .monitor-activity-container .activity {
        color: #333;
    }

    .monitor-activity-container .time {
        color: #555;
        font-size: 14px;
    }
</style>

<script type="module">
    // --- Configuration ---
    // Using '../api.js' as in your manage_users.php setup
    import { API_BASE_URL } from '../api.js'; 

    const activityLogBody = document.getElementById('activity-log-body');
    const LOG_COLSPAN = 3; // Total columns in the table

    // Helper function to format the timestamp
    function formatLogTime(timestamp) {
        if (!timestamp) return 'N/A';
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return timestamp;
            
            const options = { 
                year: 'numeric', 
                month: 'numeric', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit' 
            };
            return date.toLocaleDateString(undefined, options) + ' ' + date.toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit', second: '2-digit'});
            
        } catch (e) {
            console.error("Date formatting error:", e);
            return timestamp; 
        }
    }

    // Function to render logs in the table
    function renderActivityLogs(logs) {
        if (!logs || logs.length === 0) {
            activityLogBody.innerHTML = `<tr><td colspan="${LOG_COLSPAN}">No activity logs found.</td></tr>`;
            return;
        }

        const html = logs.map(log => `
            <tr>
                <td class="time">${formatLogTime(log.UsrLogTmstp)}</td>
                <td>${log.UserName || log.UserID || 'N/A'}</td>
                <td class="activity">${log.UsrLogAction} (${log.UsrLogDescrpt || 'No description'})</td>
            </tr>
        `).join('');
        
        activityLogBody.innerHTML = html;
    }

    // Function to fetch logs from the backend
    async function fetchActivityLogs() {
        activityLogBody.innerHTML = `<tr><td colspan="${LOG_COLSPAN}">Fetching logs...</td></tr>`;
        
        try {
            // DIRECTLY USING THE ROUTE '/activity/logs'
            const response = await fetch(`${API_BASE_URL}/activity/logs`); 
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status}.`);
            }
            
            const data = await response.json();
            
            // Check if the successful response contains the 'logs' array
            const logs = data.logs;

            if (!Array.isArray(logs)) {
                throw new Error("API response is invalid (missing 'logs' array).");
            }

            renderActivityLogs(logs);

        } catch (error) {
            console.error('Error fetching activity logs:', error);
            activityLogBody.innerHTML = `<tr><td colspan="${LOG_COLSPAN}" style="color:red;">Failed to load logs. Check API server and console for details. (${error.message})</td></tr>`;
        }
    }

    // Call the function to populate the table.
    document.addEventListener('DOMContentLoaded', fetchActivityLogs);
    fetchActivityLogs(); 
</script>