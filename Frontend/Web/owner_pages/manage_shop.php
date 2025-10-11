<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Shops - LaundroLink</title>
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
      max-width: 1100px;
      margin: 30px auto 40px;
      padding: 25px 40px;
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
      gap: 50px;
      max-width: 950px;
      margin: 0 auto;
      margin-top: 50px;
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

    /* ===== POPUP STYLE ===== */
    .popup {
      display: none;
      position: fixed;
      z-index: 999;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.5);
      overflow-y: auto;
    }

    .popup-content {
      background-color: #fff;
      margin: 5% auto;
      padding: 25px;
      border-radius: 10px;
      width: 420px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.2);
      max-height: 90vh;
      overflow-y: auto;
    }

    .popup-content h2 {
      color: #004aad;
      margin-bottom: 20px;
      text-align: center;
    }

    .popup-content label {
      font-weight: 500;
      font-size: 14px;
      color: #333;
      display: block;
      margin-top: 10px;
    }

    .popup-content input,
    .popup-content textarea,
    .popup-content select {
      width: 100%;
      padding: 10px;
      margin-top: 6px;
      border-radius: 6px;
      border: 1px solid #ccc;
      font-size: 14px;
    }

    .popup-buttons {
      text-align: center;
      margin-top: 20px;
    }

    .btn-cancel {
      background-color: #ccc;
      color: #333;
      padding: 8px 15px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      margin-right: 10px;
    }

    .btn-save {
      background-color: #004aad;
      color: white;
      padding: 8px 15px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
    }

    .btn-save:hover {
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
    // Sample data
    $shops = [
      [
        'ShopID' => 'SH01',
        'ShopName' => 'Wash N’ Dry',
        'ShopDescrp' => 'Quick and quality laundry service.',
        'ShopAddress' => 'Lapu-Lapu City',
        'ShopPhone' => '093582494443',
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
        <button class='btn-manage' 
          onclick='openManagePopup(\"{$shop['ShopID']}\", \"{$shop['ShopName']}\", \"{$shop['ShopDescrp']}\", \"{$shop['ShopAddress']}\", \"{$shop['ShopPhone']}\", \"{$shop['ShopOpeningHours']}\", \"{$shop['ShopStatus']}\")'>
          Manage
        </button>
      </div>
      ";
    }
    ?>
  </div>

  <!-- ===== Manage Shop Popup ===== -->
  <div id="managePopup" class="popup">
    <div class="popup-content">
      <h2>Manage Shop</h2>
      <form>
        <input type="hidden" id="shopID">

        <label>Shop Name</label>
        <input type="text" id="shopName" required>

        <label>Description</label>
        <textarea id="shopDescrp" rows="3" required></textarea>

        <label>Address</label>
        <input type="text" id="shopAddress" required>

        <label>Phone Number</label>
        <input type="text" id="shopPhone" required>

        <label>Opening Hours</label>
        <input type="text" id="shopHours" required>

        <label>Status</label>
        <select id="shopStatus">
          <option value="Available">Available</option>
          <option value="Closed">Closed</option>
        </select>

        <div class="popup-buttons">
          <button type="button" class="btn-cancel" onclick="closeManagePopup()">Cancel</button>
          <button type="submit" class="btn-save">Save</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    const managePopup = document.getElementById('managePopup');

    function openManagePopup(id, name, descrp, address, phone, hours, status) {
      document.getElementById('shopID').value = id;
      document.getElementById('shopName').value = name;
      document.getElementById('shopDescrp').value = descrp;
      document.getElementById('shopAddress').value = address;
      document.getElementById('shopPhone').value = phone;
      document.getElementById('shopHours').value = hours;
      document.getElementById('shopStatus').value = status;
      managePopup.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }

    function closeManagePopup() {
      managePopup.style.display = 'none';
      document.body.style.overflow = 'auto';
    }

    window.onclick = function(event) {
      if (event.target == managePopup) {
        closeManagePopup();
      }
    };
  </script>

</body>
</html>
