<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Shops</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      height: 100vh;
      overflow: hidden; 
    }

    .title-box {
      background: white;
      border-radius: 10px;
      padding: 25px 40px;
      max-width: 1000px;
      margin: 40px auto 20px;
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

    .grid-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      max-width: 950px;
      margin: 0 auto;
      padding: 20px;
    }

    .shop-card {
      background: white;
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.08);
      padding: 20px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .shop-name {
      font-weight: 600;
      font-size: 18px;
      color: #004aad;
      margin-bottom: 8px;
    }

    .shop-detail {
      font-size: 14px;
      color: #555;
      margin: 4px 0;
    }

    .shop-status {
      font-size: 13px;
      font-weight: 500;
      margin-top: 8px;
      color: #28a745;
    }

    .btn-manage {
      display: inline-block;
      background-color: #004aad;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 6px 12px;
      margin-top: 10px;
      cursor: pointer;
      text-decoration: none;
      transition: 0.3s;
      font-size: 14px;
    }

    .btn-manage:hover {
      background-color: #003c8a;
    }
  </style>
</head>
<body>

  <div class="title-box">
    <h1>My Shops</h1>
    <p>View and manage your existing laundry shops.</p>
  </div>

  <div class="grid-container">
    <?php
    // Sample data (replace with DB query)
    $shops = [
      [
        'ShopID' => 'SH01',
        'ShopName' => 'Wash N’ Dry',
        'ShopDescrp' => 'Quick and quality laundry service.',
        'ShopAddress' => 'Lapu-Lapu City',
        'ShopPhone' => '093582494443',
        'ShopOpeningHours' => '8:00am - 5:00pm',
        'ShopStatus' => 'Available'
      ],
      [
        'ShopID' => 'SH02',
        'ShopName' => 'Speed Wash',
        'ShopDescrp' => 'Fast laundry at affordable prices.',
        'ShopAddress' => 'Mandaue City',
        'ShopPhone' => '092476787433',
        'ShopOpeningHours' => '8:00am - 5:00pm',
        'ShopStatus' => 'Available'
      ],
      [
        'ShopID' => 'SH02',
        'ShopName' => 'Speed Wash',
        'ShopDescrp' => 'Fast laundry at affordable prices.',
        'ShopAddress' => 'Mandaue City',
        'ShopPhone' => '092476787433',
        'ShopOpeningHours' => '8:00am - 5:00pm',
        'ShopStatus' => 'Available'
      ]
    ];

    foreach ($shops as $shop) {
      echo "
      <div class='shop-card'>
        <div class='shop-name'>{$shop['ShopName']}</div>
        <div class='shop-detail'>{$shop['ShopDescrp']}</div>
        <div class='shop-detail'><b>Address:</b> {$shop['ShopAddress']}</div>
        <div class='shop-detail'><b>Contact:</b> {$shop['ShopPhone']}</div>
        <div class='shop-detail'><b>Hours:</b> {$shop['ShopOpeningHours']}</div>
        <div class='shop-status'>{$shop['ShopStatus']}</div>
        <a href='shop_details.php?id={$shop['ShopID']}' class='btn-manage'>Manage</a>
      </div>
      ";
    }
    ?>
  </div>

</body>
</html>
