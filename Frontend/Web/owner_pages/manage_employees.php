<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Employees - LaundroLink</title>
<style>
    body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        margin: 0;
        background-color: #f8f9fa;
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
        flex-wrap: wrap;
        gap: 15px;
    }
    h1 {
        color: #004aad;
        margin-bottom: 8px;
    }
    p {
        color: #555;
        margin: 0;
    }
    .controls-container {
        display: flex;
        align-items: center;
        gap: 20px;
    }
    .sort-container label {
        font-weight: 600;
        color: #333;
        margin-right: 8px;
    }
    .sort-container select {
        padding: 8px 12px;
        border-radius: 6px;
        border: 1px solid #ccc;
        font-size: 14px;
        background-color: white;
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
    }
    table {
        width: 90%;
        margin: 30px auto;
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
    tr:nth-child(even) {
        background-color: #f9f9f9;
    }
    tr:hover {
        background-color: #eef3ff;
    }
    .btn-update, .btn-delete {
        border: none;
        border-radius: 6px;
        padding: 6px 12px;
        cursor: pointer;
        font-size: 14px;
        transition: 0.3s;
        margin-right: 5px;
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
        margin: 8% auto;
        padding: 25px;
        border-radius: 10px;
        width: 400px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    }
    .popup-content h2 {
        color: #004aad;
        margin-bottom: 20px;
    }
    .popup-content form {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .popup-content input {
        width: 95%;
        padding: 10px;
        border-radius: 6px;
        border: 1px solid #ccc;
    }
    .popup-buttons {
        text-align: right;
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
    .btn-save:hover {
        background-color: #004aad;
    }
    .popup-delete {
        text-align: center;
    }
    .popup-delete p {
        font-size: 16px;
        color: #333;
        margin-bottom: 25px;
    }
    .btn-confirm-delete {
        background-color: #d9534f;
        color: white;
        padding: 8px 15px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
    }
    .btn-confirm-delete:hover {
        background-color: #b94642;
    }
</style>
</head>
<body>

    <div class="title-box">
        <div class="title-row">
            <div>
                <h1>Employees</h1>
                <p>View and manage your staff members.</p>
            </div>
            <div class="controls-container">
                <div class="sort-container">
                    <label for="sort-select">Sort by:</label>
                    <select id="sort-select">
                        <option value="newest">Date Created (Newest)</option>
                        <option value="oldest">Date Created (Oldest)</option>
                        <option value="name">Name (A-Z)</option>
                        <option value="age">Age (Youngest)</option>
                    </select>
                </div>
                <button class="btn-add" id="addEmployeeBtn">+ Add Employee</button>
            </div>
        </div>
    </div>

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
        <tbody id="employee-table-body">
            </tbody>
    </table>

    <div id="addPopup" class="popup">
        <div class="popup-content">
            <h2>Add Employee</h2>
            <form id="addForm">
                <input type="text" name="StaffName" placeholder="Staff Name" required>
                <input type="number" name="StaffAge" placeholder="Age">
                <input type="text" name="StaffAddress" placeholder="Address">
                <input type="text" name="StaffCellNo" placeholder="Phone Number">
                <input type="number" step="0.01" name="StaffSalary" placeholder="Salary">
                <div class="popup-buttons">
                    <button type="button" class="btn-cancel" id="addCancelBtn">Cancel</button>
                    <button type="submit" class="btn-save">Save</button>
                </div>
            </form>
        </div>
    </div>

    <div id="updatePopup" class="popup">
        <div class="popup-content">
            <h2>Update Employee</h2>
            <form id="updateForm">
                <input type="hidden" id="updateStaffId">
                <input type="text" id="updateName" required>
                <input type="number" id="updateAge">
                <input type="text" id="updateAddress">
                <input type="text" id="updatePhone">
                <input type="number" step="0.01" id="updateSalary">
                <div class="popup-buttons">
                    <button type="button" class="btn-cancel" id="updateCancelBtn">Cancel</button>
                    <button type="submit" class="btn-save">Save Changes</button>
                </div>
            </form>
        </div>
    </div>

    <div id="deletePopup" class="popup">
        <div class="popup-content popup-delete">
            <h2>Confirm Deletion</h2>
            <p id="deleteMessage">Are you sure?</p>
            <div class="popup-buttons">
                <button class="btn-cancel" id="deleteCancelBtn">Cancel</button>
                <button class="btn-confirm-delete" id="confirmDeleteBtn">Confirm Delete</button>
            </div>
        </div>
    </div>

    <script type="module">
        import { API_BASE_URL } from '/Web/api.js';

        const tableBody = document.getElementById('employee-table-body');
        const loggedInUser = JSON.parse(localStorage.getItem('laundroUser'));
        const sortSelect = document.getElementById('sort-select');
        let currentStaffId = null;

        const addPopup = document.getElementById('addPopup');
        const updatePopup = document.getElementById('updatePopup');
        const deletePopup = document.getElementById('deletePopup');
        const addForm = document.getElementById('addForm');
        const updateForm = document.getElementById('updateForm');

        document.getElementById('addEmployeeBtn').addEventListener('click', () => addPopup.style.display = 'block');
        document.getElementById('addCancelBtn').addEventListener('click', () => { addForm.reset(); addPopup.style.display = 'none'; });
        document.getElementById('updateCancelBtn').addEventListener('click', () => updatePopup.style.display = 'none');
        document.getElementById('deleteCancelBtn').addEventListener('click', () => deletePopup.style.display = 'none');
        document.getElementById('confirmDeleteBtn').addEventListener('click', handleDelete);

        const renderTable = (employees) => {
            tableBody.innerHTML = '';
            if (!employees || employees.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No employees found.</td></tr>';
                return;
            }

            employees.forEach(emp => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${emp.StaffID}</td>
                    <td>${emp.StaffName}</td>
                    <td>${emp.StaffAge || 'N/A'}</td>
                    <td>${emp.StaffAddress || 'N/A'}</td>
                    <td>${emp.StaffCellNo || 'N/A'}</td>
                    <td>₱${parseFloat(emp.StaffSalary || 0).toFixed(2)}</td>
                    <td>
                        <button class="btn-update">Update</button>
                        <button class="btn-delete">Delete</button>
                    </td>
                `;
                
                row.querySelector('.btn-update').addEventListener('click', () => {
                    currentStaffId = emp.StaffID;
                    document.getElementById('updateStaffId').value = emp.StaffID;
                    document.getElementById('updateName').value = emp.StaffName;
                    document.getElementById('updateAge').value = emp.StaffAge;
                    document.getElementById('updateAddress').value = emp.StaffAddress;
                    document.getElementById('updatePhone').value = emp.StaffCellNo;
                    document.getElementById('updateSalary').value = emp.StaffSalary;
                    updatePopup.style.display = 'block';
                });

                row.querySelector('.btn-delete').addEventListener('click', () => {
                    currentStaffId = emp.StaffID;
                    document.getElementById('deleteMessage').textContent = `Are you sure you want to delete ${emp.StaffName}?`;
                    deletePopup.style.display = 'block';
                });

                tableBody.appendChild(row);
            });
        };

        const fetchEmployees = async (sortBy = 'newest') => {
            if (!loggedInUser || !loggedInUser.ShopID) {
                tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Error: Shop ID not found. Please log in again.</td></tr>';
                return;
            }
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Loading...</td></tr>';
            try {
                const response = await fetch(`${API_BASE_URL}/users/staff/${loggedInUser.ShopID}?sortBy=${sortBy}`);
                if (!response.ok) throw new Error('Failed to fetch employees');
                const employees = await response.json();
                renderTable(employees);
            } catch (error) {
                console.error('Fetch error:', error);
                tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Error loading employees.</td></tr>`;
            }
        };

        addForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(addForm);
            const data = Object.fromEntries(formData.entries());
            data.ShopID = loggedInUser.ShopID;

            try {
                const response = await fetch(`${API_BASE_URL}/users/staff`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || result.message);
                
                alert('Employee added successfully!');
                addForm.reset();
                addPopup.style.display = 'none';
                fetchEmployees(sortSelect.value); // Refresh table with current sort
            } catch (error) {
                console.error('Add employee error:', error);
                alert(`Error: ${error.message}`);
            }
        });

        updateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                StaffName: document.getElementById('updateName').value,
                StaffAge: document.getElementById('updateAge').value,
                StaffAddress: document.getElementById('updateAddress').value,
                StaffCellNo: document.getElementById('updatePhone').value,
                StaffSalary: document.getElementById('updateSalary').value
            };

            try {
                const response = await fetch(`${API_BASE_URL}/users/staff/${currentStaffId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || result.message);
                
                alert('Employee updated successfully!');
                updatePopup.style.display = 'none';
                fetchEmployees(sortSelect.value); // Refresh table with current sort
            } catch (error) {
                console.error('Update employee error:', error);
                alert(`Error: ${error.message}`);
            }
        });

        async function handleDelete() {
            try {
                const response = await fetch(`${API_BASE_URL}/users/${currentStaffId}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || result.message);
                
                alert('Employee deleted successfully!');
                deletePopup.style.display = 'none';
                fetchEmployees(sortSelect.value); // Refresh table with current sort
            } catch (error) {
                console.error('Delete employee error:', error);
                alert(`Error: ${error.message}`);
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            sortSelect.addEventListener('change', () => {
                fetchEmployees(sortSelect.value);
            });
            fetchEmployees(); // Initial load
        });
    </script>
</body>
</html>