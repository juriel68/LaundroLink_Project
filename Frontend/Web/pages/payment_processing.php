<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Payment Processing</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #cce5ff;
      margin: 0;
      padding: 40px;
    }

    .container {
      background: #fff;
      border-radius: 12px;
      max-width: 700px;
      margin: 0 auto;
      padding: 25px 30px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }

    h2 {
      color: #0077b6;
      font-size: 24px;
      margin-bottom: 5px;
    }

    p {
      color: #555;
      margin-bottom: 20px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      border-radius: 8px;
      overflow: hidden;
    }

    th, td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }

    th {
      background-color: #0077b6;
      color: #fff;
      font-weight: 600;
    }

    tr:hover {
      background-color: #f2f6ff;
    }

    .status {
      color: green;
      font-weight: bold;
    }
  </style>
</head>
<body>

  <div class="container">
    <h2>Payment Processing</h2>
    <p>Handle and monitor customer payments.</p>

    <table>
      <thead>
        <tr>
          <th>Customer</th>
          <th>Amount</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>MJ Dimpas</td>
          <td>₱450.00</td>
          <td class="status">Completed</td>
        </tr>
        <tr>
          <td>Jasper Bulac</td>
          <td>₱593.00</td>
          <td class="status">Completed</td>
        </tr>
        <tr>
          <td>Juriel Gulane</td>
          <td>₱310.00</td>
          <td class="status">Completed</td>
        </tr>
        <tr>
          <td>Kezhea Dela Cruz</td>
          <td>₱500.00</td>
          <td class="status">Completed</td>
        </tr>
        <tr>
          <td>Anna Rose</td>
          <td>₱250.00</td>
          <td class="status">Completed</td>
        </tr>
      </tbody>
    </table>
  </div>

</body>
</html>
