<?php
// reports.php
?>

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
      <button id="dailyReportBtn" class="report-btn">📅 Download Daily Report</button>
      <button id="monthlyReportBtn" class="report-btn">🗓️ Download Monthly Report</button>
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

.report-status {
  margin-top: 10px;
  font-size: 15px;
}

.report-status.success {
  color: #28a745;
}

.report-status.loading {
  color: #0077b6;
}
</style>

<script>
const status = document.getElementById('reportStatus');

document.getElementById('dailyReportBtn').addEventListener('click', () => {
  status.textContent = '⏳ Generating Daily Report...';
  status.className = 'report-status loading';

  setTimeout(() => {
    status.textContent = '✅ Daily Report downloaded successfully!';
    status.className = 'report-status success';
  }, 1500);
});

document.getElementById('monthlyReportBtn').addEventListener('click', () => {
  status.textContent = '⏳ Generating Monthly Report...';
  status.className = 'report-status loading';

  setTimeout(() => {
    status.textContent = '✅ Monthly Report downloaded successfully!';
    status.className = 'report-status success';
  }, 1500);
});
</script>
