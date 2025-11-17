<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monitor Activity</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        /* --- FONT FIX: Applied the consistent font stack --- */
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f9fbfd;
            margin: 0;
            padding: 0;
        }

        /* Ensure the container is styled for dashboard look and feel */
        .monitor-activity-container {
            padding: 20px;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            max-width: 1000px;
            margin: 0 auto; 
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

        /* Controls Area */
        .log-controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            margin-bottom: 15px;
            gap: 15px;
        }

        .date-filters {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
        }

        .date-filters button {
            padding: 8px 15px;
            border: 1px solid #ccc;
            background-color: white;
            cursor: pointer;
            border-radius: 4px;
            transition: 0.2s;
            font-weight: 600;
        }

        .date-filters button.active {
            background-color: #0077b6;
            color: white;
            border-color: #0077b6;
        }

        /* Custom Date Inputs */
        #customDateControls {
            display: flex;
            gap: 10px;
            align-items: center;
            margin-top: 10px;
            flex-wrap: wrap;
        }
        #customDateControls label {
            font-size: 14px;
            font-weight: 500;
            color: #333;
        }
        #customDateControls input[type="date"] {
            padding: 7px 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 14px;
        }
        #customDateApplyBtn {
            background-color: #28a745;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            transition: background 0.2s;
        }
        #customDateApplyBtn:hover {
            background-color: #218838;
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
            font-size: 14px;
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
            width: 150px;
        }

        /* Pagination styles */
        .pagination-controls {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            padding-top: 15px;
            gap: 10px;
        }
        .pagination-controls button {
            background: #0077b6;
            border: none;
            color: #fff;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
        }
        .pagination-controls button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        .pagination-controls span {
            margin: 0 10px;
            font-weight: 500;
            font-size: 14px;
        }
    </style>
</head>
<body>

<div class="monitor-activity-container">
    <h2>Monitor Activity</h2>
    <p>Track user actions and activity logs within the system.</p>

    <div class="log-controls">
        <div class="date-filters">
            <button class="active" data-period="Day">Today</button>
            <button data-period="Week">Last 7 Days</button>
            <button data-period="Month">This Month</button>
            <button data-period="All">All Time</button>
            <button data-period="Custom">Custom Date</button>
        </div>
        <!-- Placeholder for potential search bar -->
    </div>

    <!-- CUSTOM DATE INPUTS -->
    <div id="customDateControls" style="display: none;">
        <label for="startDate">From:</label>
        <input type="date" id="startDate">
        <label for="endDate">To:</label>
        <input type="date" id="endDate">
        <button id="customDateApplyBtn">Apply Filter</button>
    </div>
    <!-- END CUSTOM DATE INPUTS -->

    <table>
        <thead>
            <tr>
                <th style="width: 150px;">Time</th>
                <th style="width: 100px;">User ID / Role</th>
                <th>Activity</th>
            </tr>
        </thead>
        <tbody id="activity-log-body">
            <tr><td colspan="3">Loading activity logs...</td></tr>
        </tbody>
    </table>

    <div class="pagination-controls">
        <button id="prevPageBtn" disabled>Previous</button>
        <span id="pageInfo">Page 1 of 1</span>
        <button id="nextPageBtn" disabled>Next</button>
    </div>
</div>

<script type="module">
    // --- Configuration ---
    import { API_BASE_URL } from '../api.js'; 

    const activityLogBody = document.getElementById('activity-log-body');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const pageInfoSpan = document.getElementById('pageInfo');
    const filterButtons = document.querySelectorAll('.date-filters button');
    const customDateControls = document.getElementById('customDateControls');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const customDateApplyBtn = document.getElementById('customDateApplyBtn');

    const ROWS_PER_PAGE = 15; // Set pagination limit
    const LOG_COLSPAN = 3; 

    let currentPage = 1;
    let totalLogs = 0;
    let currentPeriod = 'Day'; // Default period

    // --- Helper function to format the timestamp
    function formatLogTime(timestamp) {
        if (!timestamp) return 'N/A';
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return timestamp;
            
            const options = { 
                year: 'numeric', month: 'numeric', day: 'numeric', 
                hour: '2-digit', minute: '2-digit', second: '2-digit' 
            };
            return date.toLocaleDateString(undefined, options) + ' ' + date.toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit', second: '2-digit'});
            
        } catch (e) {
            return timestamp; 
        }
    }

    // --- RENDER FUNCTIONS ---
    
    // Function to render logs in the table
    function renderActivityLogs(logs) {
        if (!logs || logs.length === 0) {
            activityLogBody.innerHTML = `<tr><td colspan="${LOG_COLSPAN}">No activity logs found for this period.</td></tr>`;
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

    // Function to update pagination controls
    function updatePaginationControls() {
        const totalPages = Math.ceil(totalLogs / ROWS_PER_PAGE);
        pageInfoSpan.textContent = `Page ${currentPage} of ${totalPages > 0 ? totalPages : 1}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage >= totalPages;
    }

    // --- MAIN FETCH FUNCTION ---

    // Function to fetch logs from the backend
    async function fetchActivityLogs(period, page = 1, startDate = null, endDate = null) {
        currentPeriod = period;
        currentPage = page;

        activityLogBody.innerHTML = `<tr><td colspan="${LOG_COLSPAN}">Fetching logs...</td></tr>`;
        
        try {
            const limit = ROWS_PER_PAGE;
            const offset = (page - 1) * limit;

            let url = `${API_BASE_URL}/activity/logs?period=${period}&limit=${limit}&offset=${offset}`;

            // Append custom date parameters if the period is 'Custom' and dates are provided
            if (period === 'Custom' && startDate && endDate) {
                url += `&startDate=${startDate}&endDate=${endDate}`;
            }

            const response = await fetch(url); 
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}.`);
            }
            
            const data = await response.json();
            
            const logs = data.logs;
            totalLogs = data.totalCount || 0; // Assuming backend returns totalCount

            if (!Array.isArray(logs)) {
                throw new Error("API response is invalid (missing 'logs' array).");
            }

            renderActivityLogs(logs);
            updatePaginationControls();

        } catch (error) {
            console.error('Error fetching activity logs:', error);
            activityLogBody.innerHTML = `<tr><td colspan="${LOG_COLSPAN}" style="color:red;">Failed to load logs. Check API server and console for details. (${error.message})</td></tr>`;
            totalLogs = 0;
            updatePaginationControls();
        }
    }

    // --- EVENT LISTENERS ---

    // Pagination Listeners
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            // Need to determine if currently in custom mode to pass dates
            const startDate = currentPeriod === 'Custom' ? startDateInput.value : null;
            const endDate = currentPeriod === 'Custom' ? endDateInput.value : null;
            fetchActivityLogs(currentPeriod, currentPage - 1, startDate, endDate);
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(totalLogs / ROWS_PER_PAGE);
        if (currentPage < totalPages) {
            // Need to determine if currently in custom mode to pass dates
            const startDate = currentPeriod === 'Custom' ? startDateInput.value : null;
            const endDate = currentPeriod === 'Custom' ? endDateInput.value : null;
            fetchActivityLogs(currentPeriod, currentPage + 1, startDate, endDate);
        }
    });

    // Date Filter Button Listeners
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const period = button.dataset.period;
            
            if (period === 'Custom') {
                customDateControls.style.display = 'flex';
                // Do NOT fetch data yet; wait for user to hit 'Apply Filter'
                activityLogBody.innerHTML = `<tr><td colspan="${LOG_COLSPAN}" style="text-align: center;">Select a date range and click 'Apply Filter'.</td></tr>`;
                totalLogs = 0;
                updatePaginationControls();
                return;
            } else {
                customDateControls.style.display = 'none';
                // Reset to page 1 and fetch new data
                fetchActivityLogs(period, 1);
            }
        });
    });

    // Custom Date Apply Button Listener
    customDateApplyBtn.addEventListener('click', () => {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        if (!startDate || !endDate) {
            window.alert('Please select both a start date and an end date.');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            window.alert('The start date cannot be after the end date.');
            return;
        }

        // Fetch logs using the custom range
        fetchActivityLogs('Custom', 1, startDate, endDate);
    });


    // Initial fetch: Load default period (Today/Day)
    document.addEventListener('DOMContentLoaded', () => {
        const initialActiveButton = document.querySelector('.date-filters button.active');
        fetchActivityLogs(initialActiveButton.dataset.period, 1);
    });

</script>
</body>
</html>