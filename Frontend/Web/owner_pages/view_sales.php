<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sales</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      height: 100vh;
      overflow: hidden; 
    }

    .top-box {
      background: white;
            border-radius: 10px;
            max-width: 1100px;
            margin: 30px auto 40px;
            padding: 25px 40px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

    .table-box {
      background: white;
      border-radius: 10px;
      padding: 30px 40px;
      max-width: 900px;
      margin: 0 auto 80px;
      margin-top: 50px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }

    h1 {
      color: #004aad;
      margin-bottom: 8px;
    }

    p {
      color: #333;
      margin: 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: center;
      margin-top: 10px;
    }

    th, td {
      border: 1px solid #ccc;
      padding: 10px;
    }

    th {
      background-color: #f2f2f2;
    }

    tr:nth-child(even) {
      background-color: #f9f9f9;
    }

    /* Optional: summary at the bottom */
    .summary {
      margin-top: 20px;
      text-align: right;
      font-weight: bold;
      color: #004aad;
    }
  </style>
</head>
<body>

  <div class="top-box">
    <h1>Sales</h1>
    <p>View shop sales</p>
  </div>

  <div class="table-box">
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Order ID</th>
          <th>Price</th>
          <th>Expenses</th>
          <th>Total Revenue</th>
        </tr>
      </thead>
      <tbody>
        <?php
          // Mock data (replace later with DB query)
          $sales = [
            ['date' => '2025-02-01', 'order_id' => 100, 'price' => 350, 'expenses' => 100],
            ['date' => '2025-02-01', 'order_id' => 200, 'price' => 470, 'expenses' => 200],
            ['date' => '2025-02-01', 'order_id' => 300, 'price' => 250, 'expenses' => 50],
          ];

          $totalRevenue = 0;
          foreach ($sales as $sale) {
            $revenue = $sale['price'] - $sale['expenses'];
            $totalRevenue += $revenue;
            echo "<tr>
                    <td>{$sale['date']}</td>
                    <td>{$sale['order_id']}</td>
                    <td>₱{$sale['price']}</td>
                    <td>₱{$sale['expenses']}</td>
                    <td>₱{$revenue}</td>
                  </tr>";
          }
        ?>
      </tbody>
    </table>

    <div class="summary">
      <?php echo "Total Revenue: ₱" . number_format($totalRevenue, 2); ?>
    </div>
  </div>

</body>
</html>
