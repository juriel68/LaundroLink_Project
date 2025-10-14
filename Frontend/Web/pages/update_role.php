<?php
require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $userID = intval($_POST['userID']);
    $newRole = $_POST['role'];

    $stmt = $conn->prepare("UPDATE users SET role = ? WHERE userID = ?");
    $stmt->bind_param("si", $newRole, $userID);

    if ($stmt->execute()) {
        echo "<script>
                alert('Role updated successfully!');
                window.location.href = '../admindashboard.php?page=manage_users';
              </script>";
        exit;
    } else {
        echo "<script>
                alert('Error updating role!');
                window.location.href = '../admindashboard.php?page=manage_users';
              </script>";
        exit;
    }
}
?>
