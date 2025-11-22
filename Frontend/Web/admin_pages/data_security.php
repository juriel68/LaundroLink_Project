<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data Security - LaundroLink Admin</title>
    <style>
        /* --- STYLES FOR THE DATA SECURITY PAGE --- */
        body { font-family: "Segoe UI", sans-serif; margin: 0; padding: 0; background-color: #f0f8ff; }
        .data-security-container { padding: 30px; }
        .section-title { color: #023e8a; font-size: 28px; margin-bottom: 10px; }
        .section-subtitle { color: #6c757d; margin-bottom: 30px; }
        
        .backup-card {
            background: #ffffff;
            padding: 30px;
            border-radius: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            max-width: 650px;
        }
        
        .backup-card h3 { color: #0077b6; font-size: 20px; margin-bottom: 10px; }
        .backup-card p { color: #444; font-size: 15px; margin-bottom: 20px; line-height: 1.5; }
        
        .backup-btn {
            background: #0077b6; border: none; color: white; font-size: 16px;
            padding: 12px 20px; border-radius: 6px; cursor: pointer;
            transition: background 0.2s ease;
            display: inline-flex; align-items: center; gap: 8px;
        }
        .backup-btn:hover:not(:disabled) { background: #005f87; }
        .backup-btn:disabled { background: #ccc; cursor: not-allowed; }
        
        .backup-status { margin-top: 20px; font-size: 15px; font-weight: bold; line-height: 1.6; }
        .backup-status.success { color: #28a745; }
        .backup-status.loading { color: #0077b6; }
        .backup-status.failure { color: #dc3545; }
        
        .backup-status a { text-decoration: underline; color: inherit; }
    </style>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>

<div class="data-security-container">
    <h2 class="section-title">🔒 Data Security</h2>
    <p class="section-subtitle">
        Regularly back up your system data to ensure business continuity and prevent data loss.
    </p>

    <div class="backup-card">
        <h3>Database Backup</h3>
        <p>
            Click the button below to run a full system backup. This will generate an SQL file containing all users, orders, shops, and system configurations. The file will be downloaded automatically upon completion.
        </p>
        <button id="runBackupBtn" class="backup-btn">
            <i class="fas fa-download"></i> Run System Backup
        </button>

        <div id="backupStatus" class="backup-status"></div>
    </div>
</div>

<script type="module">
    import { API_BASE_URL } from '../api.js'; 

    const runBackupBtn = document.getElementById('runBackupBtn');
    const backupStatus = document.getElementById('backupStatus');

    // Retrieve logged-in user for logging purposes
    const loggedInUser = JSON.parse(localStorage.getItem('laundroUser'));
    const userId = loggedInUser ? loggedInUser.UserID : null;

    runBackupBtn.addEventListener('click', async () => {
        // 1. Set Loading State
        backupStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running backup, please wait... This may take a moment.';
        backupStatus.className = 'backup-status loading';
        runBackupBtn.disabled = true; 

        try {
            // 2. Call the API endpoint (POST)
            // We include the userId in the body so the backend can log who requested the backup
            const response = await fetch(`${API_BASE_URL}/admin/backup/run`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId }) 
            });
            
            const result = await response.json();

            if (response.ok) {
                const filename = result.filename;
                // The backend returns a relative path (e.g., /api/admin/backup/download?filename=...)
                // We append the API_BASE_URL prefix to form the full download link.
                // Note: API_BASE_URL usually includes '/api', so we check if the returned url already has it.
                // For safety, we construct the URL manually here to match admin.js logic.
                const downloadLink = `${API_BASE_URL}/admin/backup/download?filename=${filename}&userId=${userId}`;
                
                // 3. Update status
                backupStatus.innerHTML = `✅ Backup <strong>${filename}</strong> completed!<br>Your download should start automatically. If not, <a href="${downloadLink}" target="_blank">click here to download manually</a>.`;
                backupStatus.className = 'backup-status success';
                
                // 4. Trigger Download via invisible iframe (smoother UX than window.location)
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = downloadLink;
                document.body.appendChild(iframe);
                
                // Remove iframe after a delay to ensure request is sent
                setTimeout(() => document.body.removeChild(iframe), 60000); 

            } else {
                throw new Error(result.message || 'Unknown server error');
            }
        } catch (error) {
            backupStatus.textContent = `❌ Backup failed: ${error.message}. Check server logs for details.`;
            backupStatus.className = 'backup-status failure';
            console.error('Backup Error:', error);
        } finally {
            runBackupBtn.disabled = false;
        }
    });
</script>

</body>
</html>