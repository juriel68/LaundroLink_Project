<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Orders</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      height: 100vh;
      overflow: hidden; 
    }

    /* Top section (title + description) */
    .section {
      background: white;
      border-radius: 10px;
      padding: 25px 40px;
      max-width: 1000px;
      margin: 40px auto 20px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }

    /* Table section */
    .table-section {
      background: white;
      border-radius: 10px;
      padding: 30px 40px;
      max-width: 900px;
      margin: 0 auto 80px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }

    h1 {
      color: #004aad;
      margin-bottom: 8px;
    }

    p {
      color: #333;
      margin-bottom: 0px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: center;
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

    .status-delivered {
      color: green;
      font-weight: bold;
    }

    .status-processing {
      color: orange;
      font-weight: bold;
    }
  </style>
</head>
<body>

  <!-- Section 1: Header -->
  <div class="section">
    <h1>Orders</h1>
    <p>View order history</p>
  </div>

  <!-- Section 2: Orders Table -->
  <div class="table-section">
    <table>
      <tr>
        <th>Order ID</th>
        <th>Customer ID</th>
        <th>Type</th>
        <th>Details</th>
        <th>Price</th>
        <th>Status</th>
        <th>Date</th>
      </tr>

      <?php
      // Example static data (replace with DB query later)
      $orders = [
        ['id'=>111, 'customer'=>'001', 'type'=>'Washing', 'details'=>'3.5 kg', 'price'=>'₱350', 'status'=>'Delivered', 'date'=>'2025-02-01'],
        ['id'=>222, 'customer'=>'002', 'type'=>'Folding', 'details'=>'4.7 kg', 'price'=>'₱470', 'status'=>'Delivered', 'date'=>'2025-02-01'],
        ['id'=>333, 'customer'=>'003', 'type'=>'Steam Press', 'details'=>'2.5 kg', 'price'=>'₱250', 'status'=>'Processing', 'date'=>'2025-02-01']
      ];

      foreach ($orders as $order) {
        $statusClass = strtolower($order['status']) === 'delivered' ? 'status-delivered' : 'status-processing';
        echo "
        <tr>
          <td>{$order['id']}</td>
          <td>{$order['customer']}</td>
          <td>{$order['type']}</td>
          <td>{$order['details']}</td>
          <td>{$order['price']}</td>
          <td class='$statusClass'>{$order['status']}</td>
          <td>{$order['date']}</td>
        </tr>";
      }
      ?>
    </table>
  </div>

</body>
</html>
