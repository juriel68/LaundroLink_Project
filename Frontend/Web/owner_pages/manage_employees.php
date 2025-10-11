<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Employees - LaundroLink</title>
<style>
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin: 0;
  }

  .title-box {
   background: white;
            border-radius: 10px;
            max-width: 1100px;
            margin: 30px auto 40px;
            padding: 25px 40px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

  .title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  h1 {
    color: #004aad;
    margin-bottom: 8px;
  }

  p {
    color: #555;
    margin: 0;
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
  .btn-add:hover { background-color: #004aad; }

  table {
    width: 90%;
    margin: 30px auto;
    margin-top: 50px;
    border-collapse: collapse;
    background: white;
    box-shadow: 0 4px 10px rgba(0,0,0,0.08);
    border-radius: 10px;
    overflow: hidden;
  }

  th, td {
    padding: 12px 15px;
    text-align: left;
  }

  th {
    background-color: #004aad;
    color: white;
    font-weight: 600;
    font-size: 15px;
  }

  tr:nth-child(even) { background-color: #f9f9f9; }
  tr:hover { background-color: #eef3ff; }

  .btn-update, .btn-delete {
    border: none;
    border-radius: 6px;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 14px;
    transition: 0.3s;
    margin-right: 5px;
  }
  .btn-update { background-color: #004aad; color: white; }
  .btn-update:hover { background-color: #003c8a; }
  .btn-delete { background-color: #d9534f; color: white; }
  .btn-delete:hover { background-color: #b94642; }

  /* POPUP STYLES */
  .popup {
    display: none;
    position: fixed;
    z-index: 999;
    left: 0; top: 0;
    width: 100%; height: 100%;
    background-color: rgba(0,0,0,0.5);
  }
  .popup-content {
    background-color: #fff;
    margin: 8% auto;
    padding: 25px;
    border-radius: 10px;
    width: 400px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    text-align: center;
  }
  .popup-content h2 {
    color: #004aad;
    margin-bottom: 20px;
  }
  .popup-content input {
    width: 100%;
    padding: 10px;
    margin: 8px 0;
    border-radius: 6px;
    border: 1px solid #ccc;
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
    background-color: #0b53ce;
    color: white;
    padding: 8px 15px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
  }
  .btn-save:hover { background-color: #004aad; }
  .popup-delete p { font-size: 16px; color: #333; margin-bottom: 25px; }
  .btn-confirm-delete {
    background-color: #d9534f;
    color: white;
    padding: 8px 15px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
  }
  .btn-confirm-delete:hover { background-color: #b94642; }
</style>
</head>
<body>

  <div class="title-box">
    <div class="title-row">
      <div>
        <h1>Employees</h1>
        <p>View and manage your staff members.</p>
      </div>
      <button class="btn-add" onclick="openPopup()">+ Add Employee</button>
    </div>
  </div>

  <?php
  // === Mock employee data ===
  $employees = [
    ['id' => 'S101', 'name' => 'Angel Berth', 'age' => 26, 'address' => 'Cebu City', 'phone' => '09171234567', 'salary' => 500],
    ['id' => 'S102', 'name' => 'Jasper Bulac', 'age' => 28, 'address' => 'Mandaue City', 'phone' => '09182345678', 'salary' => 450],
    ['id' => 'S103', 'name' => 'MJ Dmpas', 'age' => 25, 'address' => 'Lapu-Lapu City', 'phone' => '09193456789', 'salary' => 800],
    ['id' => 'S104', 'name' => 'Juriel Gulane', 'age' => 30, 'address' => 'Talisay City', 'phone' => '09204567890', 'salary' => 500],
  ];
  ?>

  <table>
    <thead>
      <tr>
        <th>Staff ID</th>
        <th>Staff Name</th>
        <th>Age</th>
        <th>Address</th>
        <th>Phone Number</th>
        <th>Salary</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($employees as $emp): ?>
      <tr>
        <td><?= htmlspecialchars($emp['id']) ?></td>
        <td><?= htmlspecialchars($emp['name']) ?></td>
        <td><?= htmlspecialchars($emp['age']) ?></td>
        <td><?= htmlspecialchars($emp['address']) ?></td>
        <td><?= htmlspecialchars($emp['phone']) ?></td>
        <td>₱<?= number_format($emp['salary'], 2) ?></td>
        <td>
          <button 
            class="btn-update" 
            onclick="openUpdatePopup('<?= htmlspecialchars($emp['name']) ?>', '<?= htmlspecialchars($emp['age']) ?>', '<?= htmlspecialchars($emp['address']) ?>', '<?= htmlspecialchars($emp['phone']) ?>', '<?= htmlspecialchars($emp['salary']) ?>')"
          >Update</button>
          <button 
            class="btn-delete" 
            onclick="openDeletePopup('<?= htmlspecialchars($emp['name']) ?>')"
          >Delete</button>
        </td>
      </tr>
      <?php endforeach; ?>
    </tbody>
  </table>

  <!-- ===== Add Employee Popup ===== -->
  <div id="addPopup" class="popup">
    <div class="popup-content">
      <h2>Add Employee</h2>
      <form>
        <input type="text" placeholder="Staff Name" required>
        <input type="number" placeholder="Age" required>
        <input type="text" placeholder="Address" required>
        <input type="text" placeholder="Phone Number" required>
        <input type="number" placeholder="Salary" required>
        <div class="popup-buttons">
          <button type="button" class="btn-cancel" onclick="closePopup()">Cancel</button>
          <button type="submit" class="btn-save">Save</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ===== Update Employee Popup ===== -->
  <div id="updatePopup" class="popup">
    <div class="popup-content">
      <h2>Update Employee</h2>
      <form id="updateForm">
        <input type="text" id="updateName" placeholder="Staff Name" required>
        <input type="number" id="updateAge" placeholder="Age" required>
        <input type="text" id="updateAddress" placeholder="Address" required>
        <input type="text" id="updatePhone" placeholder="Phone Number" required>
        <input type="number" id="updateSalary" placeholder="Salary" required>
        <div class="popup-buttons">
          <button type="button" class="btn-cancel" onclick="closeUpdatePopup()">Cancel</button>
          <button type="submit" class="btn-save">Save Changes</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ===== Delete Confirmation Popup ===== -->
  <div id="deletePopup" class="popup">
    <div class="popup-content popup-delete">
      <h2>Confirm Deletion</h2>
      <p id="deleteMessage">Are you sure you want to delete this employee?</p>
      <div class="popup-buttons">
        <button class="btn-cancel" onclick="closeDeletePopup()">Cancel</button>
        <button class="btn-confirm-delete" onclick="confirmDelete()">Confirm Delete</button>
      </div>
    </div>
  </div>

  <script>
    // ===== Add Employee Popup =====
    const addPopup = document.getElementById('addPopup');
    function openPopup() { addPopup.style.display = 'block'; }
    function closePopup() { addPopup.style.display = 'none'; }

    // ===== Delete Popup =====
    const deletePopup = document.getElementById('deletePopup');
    const deleteMessage = document.getElementById('deleteMessage');
    let employeeToDelete = '';

    function openDeletePopup(name) {
      employeeToDelete = name;
      deleteMessage.textContent = `Are you sure you want to delete ${name}?`;
      deletePopup.style.display = 'block';
    }

    function closeDeletePopup() {
      deletePopup.style.display = 'none';
    }

    function confirmDelete() {
      alert(`${employeeToDelete} has been deleted.`);
      deletePopup.style.display = 'none';
      // TODO: Add backend deletion logic here
    }

    // ===== Update Popup =====
    const updatePopup = document.getElementById('updatePopup');
    const updateForm = document.getElementById('updateForm');

    function openUpdatePopup(name, age, address, phone, salary) {
      document.getElementById('updateName').value = name;
      document.getElementById('updateAge').value = age;
      document.getElementById('updateAddress').value = address;
      document.getElementById('updatePhone').value = phone;
      document.getElementById('updateSalary').value = salary;
      updatePopup.style.display = 'block';
    }

    function closeUpdatePopup() {
      updatePopup.style.display = 'none';
    }

    updateForm.addEventListener('submit', function(e) {
      e.preventDefault();
      alert(`Employee ${document.getElementById('updateName').value} updated successfully!`);
      updatePopup.style.display = 'none';
      // TODO: Add backend update logic here
    });
  </script>

</body>
</html>
