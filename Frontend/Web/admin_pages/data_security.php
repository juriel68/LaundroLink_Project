<?php
// data_security.php
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

.backup-btn:hover {
  background: #005f87;
}

.backup-status {
  margin-top: 20px;
  font-size: 15px;
}

.backup-status.success {
  color: #28a745;
}

.backup-status.loading {
  color: #0077b6;
}
</style>

<script>
document.getElementById('runBackupBtn').addEventListener('click', () => {
  const status = document.getElementById('backupStatus');
  status.textContent = '⏳ Running backup, please wait...';
  status.className = 'backup-status loading';

  // Simulate backup process delay
  setTimeout(() => {
    status.textContent = '✅ Backup completed successfully!';
    status.className = 'backup-status success';
  }, 1500);
});
</script>
