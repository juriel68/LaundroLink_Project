<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Manage Shop Details</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
    }

    .container {
      background: white;
      border-radius: 10px;
      padding: 30px 40px;
      max-width: 900px;
      margin: 45px auto;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }

    .header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 25px;
      color: #004aad;
    }

    .back-arrow {
      font-size: 22px;
      font-weight: bold;
      cursor: pointer;
      text-decoration: none;
      color: #004aad;
    }

    .back-arrow:hover {
      color: #003c8a;
    }

    h1 {
      font-size: 22px;
      margin: 0;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    label {
      font-weight: 600;
      color: #333;
      margin-bottom: 6px;
    }

    input, textarea, select {
      width: 100%;
      padding: 10px 12px;
      border-radius: 6px;
      border: 1px solid #ccc;
      font-size: 15px;
      outline: none;
      transition: border-color 0.3s;
    }

    input:focus, textarea:focus, select:focus {
      border-color: #004aad;
    }

    textarea {
      resize: vertical;
      min-height: 90px;
    }

    .btn-row {
      display: flex;
      justify-content: flex-end;
      gap: 15px;
      margin-top: 25px;
    }

    .btn {
      border: none;
      border-radius: 6px;
      padding: 10px 18px;
      cursor: pointer;
      font-size: 15px;
      font-weight: 500;
      transition: background-color 0.3s;
    }

    .btn-cancel {
      background-color: #ccc;
      color: #000;
      text-decoration: none;
    }

    .btn-cancel:hover {
      background-color: #b3b3b3;
    }

    .btn-save {
      background-color: #004aad;
      color: #fff;
    }

    .btn-save:hover {
      background-color: #003c8a;
    }

  </style>
</head>
<body>

<a href="my_shops.php" class="back-arrow">🢀</a>

  <div class="container">
    <div class="header">
      
      <h1>Manage Shop Details</h1>
    </div>

    <?php
      // Example: Fetch shop details from database using ID
      $shop = [
        'ShopID' => 'SH01',
        'ShopName' => 'Wash N’ Dry',
        'ShopDescrp' => 'Reliable laundry and dry-cleaning service.',
        'ShopAddress' => 'Lapu-Lapu City',
        'ShopPhone' => '093582494443',
        'ShopOpeningHours' => '8:00am - 5:00pm',
        'ShopStatus' => 'Available'
      ];
    ?>

    <form action="update_shop.php" method="POST">
      <input type="hidden" name="ShopID" value="<?php echo $shop['ShopID']; ?>">

      <div>
        <label>Shop Name</label>
        <input type="text" name="ShopName" value="<?php echo $shop['ShopName']; ?>" required>
      </div>

      <div>
        <label>Description</label>
        <textarea name="ShopDescrp"><?php echo $shop['ShopDescrp']; ?></textarea>
      </div>

      <div>
        <label>Address</label>
        <input type="text" name="ShopAddress" value="<?php echo $shop['ShopAddress']; ?>" required>
      </div>

      <div>
        <label>Phone</label>
        <input type="text" name="ShopPhone" value="<?php echo $shop['ShopPhone']; ?>" required>
      </div>

      <div>
        <label>Opening Hours</label>
        <input type="text" name="ShopOpeningHours" value="<?php echo $shop['ShopOpeningHours']; ?>">
      </div>

      <div>
        <label>Status</label>
        <select name="ShopStatus">
          <option value="Available" <?php if ($shop['ShopStatus'] == 'Available') echo 'selected'; ?>>Available</option>
          <option value="Closed">Closed</option>
          <option value="Under Maintenance">Under Maintenance</option>
        </select>
      </div>

      <div class="btn-row">
        <a href="my_shops.php" class="btn btn-cancel">Cancel</a>
        <button type="submit" class="btn btn-save">Save Changes</button>
      </div>
    </form>
  </div>

</body>
</html>
