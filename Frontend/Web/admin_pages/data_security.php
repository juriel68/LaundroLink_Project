<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data Security - LaundroLink Admin</title>
    </head>
<body>

<?php
// data_security.php
// This file contains the HTML and client-side JavaScript for the Data Security UI.
?>

<div class="data-security-container">
    <h2 class="section-title">🔒 Data Security</h2>
    <p class="section-subtitle">
        Regularly back up your system data to ensure business continuity and prevent data loss.
    </p>

    <div class="backup-card">
        <h3>Database Backup</h3>
        <p>
            Click the button below to run a full system backup. This will export all important data (users, orders, and system configurations) into a secure backup file.
        </p>
        <button id="runBackupBtn" class="backup-btn">Run Backup</button>

        <div id="backupStatus" class="backup-status"></div>
    </div>
</div>

<style>
/* --- STYLES FOR THE DATA SECURITY PAGE --- */
.data-security-container {
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

.backup-card {
    background: #ffffff;
    padding: 30px;
    border-radius: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    max-width: 650px;
}

.backup-card h3 {
    color: #0077b6;
    font-size: 20px;
    margin-bottom: 10px;
}

.backup-card p {
    color: #444;
    font-size: 15px;
    margin-bottom: 20px;
}

.backup-btn {
    background: #0077b6;
    border: none;
    color: white;
    font-size: 16px;
    padding: 12px 20px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s ease;
}

.backup-btn:hover:not(:disabled) {
    background: #005f87;
}

.backup-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.backup-status {
    margin-top: 20px;
    font-size: 15px;
    font-weight: bold;
}

.backup-status.success {
    color: #28a745;
}

.backup-status.loading {
    color: #0077b6;
}

.backup-status.failure {
    color: #dc3545;
}
</style>

<script type="module">
    import { API_BASE_URL } from '../api.js'; 

    const runBackupBtn = document.getElementById('runBackupBtn');
    const backupStatus = document.getElementById('backupStatus');

    runBackupBtn.addEventListener('click', async () => {
        // 1. Set Loading State
        backupStatus.textContent = '⏳ Running backup, please wait... This may take a moment.';
        backupStatus.className = 'backup-status loading';
        runBackupBtn.disabled = true; // Prevent multiple clicks during the process

        try {
            // 2. Call the new API endpoint using the imported base URL
            const response = await fetch(`${API_BASE_URL}/admin/backup/run`, {
                method: 'POST',
                // Add Authorization header here if your app uses one
            });

            const result = await response.json();

            if (response.ok) {
                // Success: Backend confirmed the dump file was created
                const filename = result.filename;
                const downloadUrl = result.downloadUrl;
                
                // 3. Update status and initiate download
                backupStatus.innerHTML = `✅ Backup **${filename}** completed! Your download should start automatically. If it doesn't, <a href="${downloadUrl}">click here to download</a>.`;
                backupStatus.className = 'backup-status success';
                
                // Auto-initiate download by navigating to the download URL
                window.location.href = downloadUrl;

            } else {
                // Failure: Server reported an error (e.g., mysqldump failed)
                backupStatus.textContent = `❌ Backup failed: ${result.message || 'Unknown server error'}. Check console for details.`;
                backupStatus.className = 'backup-status failure'; 
                console.error('Backup API error:', result);
            }
        } catch (error) {
            // Network Failure: The request didn't even reach the server
            backupStatus.textContent = `❌ Network Error: Could not reach the server or API endpoint.`;
            backupStatus.className = 'backup-status failure';
            console.error('Fetch error:', error);
        } finally {
            runBackupBtn.disabled = false; // Re-enable button
        }
    });
</script>

</body>
</html>