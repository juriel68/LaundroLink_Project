<?php
// JSON file storage
$dataFile = 'employees.json';
if (file_exists($dataFile)) {
  $employees = json_decode(file_get_contents($dataFile), true);
} else {
  $employees = [
    ['id' => 'S101', 'name' => 'Angel Berth'],
    ['id' => 'S102', 'name' => 'Jasper Bulac'],
    ['id' => 'S103', 'name' => 'MJ Dmpas'],
    ['id' => 'S104', 'name' => 'Juriel Gulane']
  ];
}

// Delete
if (isset($_GET['delete'])) {
  $employees = array_filter($employees, fn($e) => $e['id'] != $_GET['delete']);
  file_put_contents($dataFile, json_encode(array_values($employees), JSON_PRETTY_PRINT));
  header("Location: ".$_SERVER['PHP_SELF']);
  exit;
}

// Update (rename)
if (isset($_POST['update'])) {
  foreach ($employees as &$emp) {
    if ($emp['id'] == $_POST['id']) {
      $emp['name'] = $_POST['name'];
      break;
    }
  }
  file_put_contents($dataFile, json_encode($employees, JSON_PRETTY_PRINT));
  header("Location: ".$_SERVER['PHP_SELF']);
  exit;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Employees - LaundroLink</title>
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

/* Title + Button in one row */
.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

  .grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    max-width: 950px;
    margin: 0 auto;
    padding: 20px;
  }

  .employee-card {
    background: white;
    border-radius: 10px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.08);
    padding: 20px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .employee-name {
    font-weight: 600;
    font-size: 18px;
    color: #000000ff;
    margin-bottom: 8px;
  }

  .employee-id {
    font-size: 14px;
    color: #555;
    margin: 4px 0;
  }

  .actions {
    margin-top: 10px;
  }

  .btn-update, .btn-delete {
    display: inline-block;
    border: none;
    border-radius: 6px;
    padding: 6px 12px;
    margin-right: 6px;
    cursor: pointer;
    text-decoration: none;
    font-size: 14px;
    transition: 0.3s;
  }

  .btn-update {
    background-color: #004aad;
    color: white;
  }

  .btn-update:hover {
    background-color: #003c8a;
  }

  .btn-delete {
    background-color: #d9534f;
    color: white;
  }

  .btn-delete:hover {
    background-color: #b94642;
  }

 .btn-add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background-color: #0b53ce;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  cursor: pointer;
  text-decoration: none;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
  transition: all 0.25s ease;
}

.btn-add:hover {
  background-color: #004aad;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}


</style>
</head>
<body>

  <div class="title-box">
  <div class="title-row">
    <div class="title-text">
      <h1>Employees</h1>
      <p>View and manage your staff members.</p>
    </div>
    <a href="add_employee.php" class="btn-add">+ Add Employee</a>
  </div>
</div>


  <div class="grid-container">
    <?php foreach ($employees as $emp): ?>
      <div class="employee-card">
        <div class="employee-name"><?= htmlspecialchars($emp['name']) ?></div>
        <div class="employee-id"><b>Staff ID:</b> <?= htmlspecialchars($emp['id']) ?></div>
        <div class="actions">
          <form method="POST" style="display:inline-block;">
            <input type="hidden" name="id" value="<?= $emp['id'] ?>">
            <input type="text" name="name" value="<?= $emp['name'] ?>" hidden>
          <a href="update_employee.php?id=<?= urlencode($emp['id']) ?>">
             <button type="button" class="btn-update">Update</button>
           </a>         
           </form>
          <a href="?delete=<?= $emp['id'] ?>" onclick="return confirm('Delete this employee?')">
            <button type="button" class="btn-delete">Delete</button>
          </a>
        </div>
      </div>
    <?php endforeach; ?>
  </div>

</body>
</html>
