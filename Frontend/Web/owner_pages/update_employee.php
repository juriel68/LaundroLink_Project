<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Update Employee - LaundroLink</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      min-height: 100vh;
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
      margin-bottom: 8px;
      display: block;
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
      box-shadow: 0 0 5px rgba(0,74,173,0.3);
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      column-gap: 40px;
      row-gap: 25px;
    }

    @media (max-width: 700px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
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

<a href="employees.php" class="back-arrow">🢀</a>

<div class="container">
  <div class="header">
    <h1>Employee Information</h1>
  </div>

  <?php
    // Example: Fetch employee details from database by ID
    // Replace this with your actual database query
    $id = $_GET['id'] ?? '';
    
    // Mock data for demo (replace with database fetch)
    $employee = [
      'id' => 'SI02',
      'name' => 'Maria Santos',
      'age' => 28,
      'address' => 'Mandaue City, Cebu',
      'phone' => '09123456789',
      'salary' => 645
    ];

    // TODO: Replace $employee above with DB query using $id
  ?>

  <form method="POST" action="employees.php">
    <div class="form-grid">
      <div>
        <label for="id">Staff ID</label>
        <input type="text" id="id" name="id" value="<?= htmlspecialchars($employee['id']) ?>" readonly>
      </div>

      <div>
        <label for="name">Staff Name</label>
        <input type="text" id="name" name="name" value="<?= htmlspecialchars($employee['name']) ?>" required>
      </div>

      <div>
        <label for="age">Age</label>
        <input type="number" id="age" name="age" value="<?= htmlspecialchars($employee['age']) ?>" min="18" required>
      </div>

      <div>
        <label for="address">Address</label>
        <input type="text" id="address" name="address" value="<?= htmlspecialchars($employee['address']) ?>" required>
      </div>

      <div>
        <label for="phone">Phone Number</label>
        <input type="text" id="phone" name="phone" value="<?= htmlspecialchars($employee['phone']) ?>" required>
      </div>

      <div>
        <label for="salary">Salary (₱)</label>
        <input type="number" id="salary" name="salary" value="<?= htmlspecialchars($employee['salary']) ?>" required>
      </div>
    </div>

    <div class="btn-row">
      <a href="employees.php" class="btn btn-cancel">Cancel</a>
      <button type="submit" name="update" class="btn btn-save">Save Changes</button>
    </div>
  </form>
</div>

</body>
</html>
