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
      padding: 25px 35px;
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

    /* ===== PAGE CONTAINER ===== */
.grid-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  height: calc(100vh - 150px);
  padding-top: 20px;
}

/* ===== SHOP CARD ===== */
.shop-card {
  background: white;
  border-radius: 20px;
  padding: 35px 45px;
  width: 90%;
  max-width: 650px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  text-align: left;
  transition: all 0.3s ease;
  position: relative;
  margin-top: 0;
}

    .shop-name {
      font-weight: 800;
      font-size: 30px;
      color: #004aad;
      margin-bottom: 10px;
      text-align: center;
    }

    .shop-descrp {
      color: #555;
      font-size: 16px;
      margin-bottom: 25px;
      line-height: 1.7;
      text-align: center;
      font-style: italic;
    }

   /* Small tweak for inside content */
.details-box {
  background: #89CFF0;
  border-radius: 10px;
  padding: 20px 25px;
  margin-bottom: 20px;
  border-left: 5px solid #004aad;
}

.shop-status {
  margin: 10px auto 15px;
}
    .shop-detail b {
      color: #004aad;
      min-width: 90px;
    }

    .shop-status {
      display: inline-block;
      font-size: 15px;
      font-weight: 600;
      color: #28a745;
      background: #e8f7ed;
      padding: 8px 18px;
      border-radius: 20px;
      margin: 0 auto 25px;
      text-align: center;
      display: block;
      width: fit-content;
    }

    .btn-manage {
      display: block;
      background-color: #004aad;
      color: white;
      border: none;
      border-radius: 10px;
      padding: 14px 35px;
      cursor: pointer;
      text-decoration: none;
      font-size: 17px;
      font-weight: 600;
      transition: all 0.3s ease;
      margin: 0 auto;
    }

    .btn-manage:hover {
      background-color: #003c8a;
      transform: scale(1.05);
    }

    /* ===== POPUP ===== */
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
      padding: 30px;
      border-radius: 12px;
      width: 420px;
      box-shadow: 0 6px 16px rgba(0,0,0,0.25);
      max-height: 90vh;
      overflow-y: auto;
      animation: fadeIn 0.3s ease;
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
      margin-top: 25px;
    }

    .btn-cancel {
      background-color: #ccc;
      color: #333;
      padding: 10px 18px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      margin-right: 10px;
      font-weight: 500;
    }

    .btn-save {
      background-color: #004aad;
      color: white;
      padding: 10px 18px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      font-weight: 500;
    }

    .btn-save:hover {
      background-color: #003c8a;
    }

    .icon {
      font-size: 16px;
      color: #004aad;
    }

    @keyframes fadeIn {
      from {opacity: 0; transform: translateY(-10px);}
      to {opacity: 1; transform: translateY(0);}
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
        <div class='shop-descrp'>{$shop['ShopDescrp']}</div>

        <div class='details-box'>
          <div class='shop-detail'><span class='icon'>📍</span><b>Address:</b> {$shop['ShopAddress']}</div>
          <div class='shop-detail'><span class='icon'>📞</span><b>Contact:</b> {$shop['ShopPhone']}</div>
          <div class='shop-detail'><span class='icon'>⏰</span><b>Hours:</b> {$shop['ShopOpeningHours']}</div>
        </div>

        <div class='shop-status'>{$shop['ShopStatus']}</div>

        <button class='btn-manage' 
          onclick='openManagePopup(
            \"{$shop['ShopID']}\", 
            \"{$shop['ShopName']}\", 
            \"{$shop['ShopDescrp']}\", 
            \"{$shop['ShopAddress']}\", 
            \"{$shop['ShopPhone']}\", 
            \"{$shop['ShopOpeningHours']}\", 
            \"{$shop['ShopStatus']}\")'>
          Manage Shop
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
          <option value='Available'>Available</option>
          <option value='Closed'>Closed</option>
        </select>

        <div class='popup-buttons'>
          <button type='button' class='btn-cancel' onclick='closeManagePopup()'>Cancel</button>
          <button type='submit' class='btn-save'>Save</button>
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
