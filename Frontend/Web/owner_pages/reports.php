<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Generate Reports</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      height: 100vh;
      overflow: hidden;
    }

    .section {
      background: white;
      border-radius: 10px;
      max-width: 1000px;
      margin: 20px auto;
      padding: 25px 40px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }

    h1 {
      color: #004aad;
      margin-bottom: 5px;
    }

    p {
      color: #333;
      margin-bottom: 15px;
    }

    .button-section {
      text-align: center;
    }

    .btn {
      background-color: #004aad;
      color: white;
      border: none;
      padding: 12px 20px;
      font-size: 16px;
      border-radius: 5px;
      cursor: pointer;
      text-decoration: none;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      transition: 0.2s;
      margin: 0 15px;
    }

    .btn:hover {
      background-color: #003c8a;
      transform: translateY(-2px);
    }
  </style>
</head>
<body>

  <!-- First box (title + description) -->
  <div class="section">
    <h1>Generate Reports</h1>
    <p>Generate and download order and sales reports</p>
  </div>

  <!-- Second box (buttons) -->
  <div class="button-section">
    <a href="daily_report.php" class="btn">Download Daily Report</a>
    <a href="monthly_report.php" class="btn">Download Monthly Report</a>
  </div>

</body>
</html>
