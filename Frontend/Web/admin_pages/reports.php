<div class="reports-container">
    <h2 class="section-title">📊 Generate Reports</h2>
    <p class="section-subtitle">
        Download system-generated reports for business performance and monitoring.
    </p>

    <div class="reports-card">
        <h3>Available Reports</h3>
        <p>
            Choose which report you want to download. The system will automatically compile the data for the selected timeframe.
        </p>

        <div class="button-group">
            <button id="dailyReportBtn" class="report-btn" data-report-type="daily">📅 Download Daily Report</button>
            <button id="monthlyReportBtn" class="report-btn" data-report-type="monthly">🗓️ Download Monthly Report</button>
        </div>

        <div id="reportStatus" class="report-status"></div>
    </div>
</div>

<style>
.reports-container {
    padding: 30px;
    font-family: "Segoe UI", sans-serif;
}

.section-title {
    color: #023e8a;
    font-size: 28px;
    margin-bottom: 10px;
}

.section-subtitle {
    color: #6c757d;
    margin-bottom: 30px;
}

.reports-card {
    background: #ffffff;
    padding: 30px;
    border-radius: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    max-width: 650px;
}

.reports-card h3 {
    color: #0077b6;
    font-size: 20px;
    margin-bottom: 10px;
}

.reports-card p {
    color: #444;
    font-size: 15px;
    margin-bottom: 20px;
}

.button-group {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
}

.report-btn {
    background: #0077b6;
    border: none;
    color: white;
    font-size: 16px;
    padding: 12px 20px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s ease;
}

.report-btn:hover {
    background: #005f87;
}

/* New style for disabled button */
.report-btn:disabled {
    background: #adb5bd;
    cursor: not-allowed;
}

.report-status {
    margin-top: 10px;
    font-size: 15px;
    font-weight: 600; /* Added weight for better visibility */
}

.report-status.success {
    color: #28a745;
}

/* New style for error state */
.report-status.error {
    color: #dc3545;
}

.report-status.loading {
    color: #0077b6;
}
</style>

<script type="module">
// MODIFICATION: Use the correct import path to api.js (one level up from admin_pages)
import { API_BASE_URL } from '../api.js'; 
// Note: We remove the fallback 'window.parent.API_BASE_URL' because modules handle this cleanly.

const statusDiv = document.getElementById('reportStatus');
const dailyBtn = document.getElementById('dailyReportBtn');
const monthlyBtn = document.getElementById('monthlyReportBtn');

// Attach event listeners using the single generic function
dailyBtn.addEventListener('click', () => generateReport('daily', dailyBtn));
monthlyBtn.addEventListener('click', () => generateReport('monthly', monthlyBtn));

async function generateReport(reportType, button) {
    // 1. Set Loading State
    button.disabled = true;
    statusDiv.textContent = `⏳ Compiling ${reportType} report. This may take a moment...`;
    statusDiv.className = 'report-status loading';

    try {
        // 2. Call the Backend API
        const response = await fetch(`${API_BASE_URL}/admin/reports/download?type=${reportType}`, {
            method: 'GET',
        });

        if (!response.ok) {
            // Try to read an error message (usually JSON)
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            } else {
                // Handle case where server sent a non-JSON error (e.g., HTML, plain text)
                throw new Error(`HTTP error! Status: ${response.status}. Failed to get report data.`);
            }
        }

        // 3. Process the file download
        const blob = await response.blob();
        const filenameHeader = response.headers.get('Content-Disposition');
        
        // Extract filename from Content-Disposition header (e.g., attachment; filename="report.csv")
        let filename = `${reportType}_report.csv`;
        if (filenameHeader && filenameHeader.includes('filename=')) {
            const matches = filenameHeader.match(/filename="?([^"]+)"?/);
            if (matches && matches.length > 1) {
                filename = matches[1];
            }
        }

        // Create a temporary link element and trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url); // Clean up

        // 4. Set Success State
        const capitalizedType = reportType.charAt(0).toUpperCase() + reportType.slice(1);
        statusDiv.textContent = `✅ ${capitalizedType} Report (${filename}) downloaded successfully!`;
        statusDiv.className = 'report-status success';

    } catch (error) {
        // 5. Set Error State
        console.error('Report Generation Error:', error.message);
        statusDiv.textContent = `❌ Report failed. Error: ${error.message}. Check backend logs.`;
        statusDiv.className = 'report-status error';
    } finally {
        // 6. Re-enable button
        button.disabled = false;
    }
}
</script>