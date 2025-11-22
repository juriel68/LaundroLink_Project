<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Employees - LaundroLink</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
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
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
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
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
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

    /* Status Badge */
    .status-badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
    }
    .status-active { background: #d4edda; color: #155724; }
    .status-inactive { background: #f8d7da; color: #721c24; }

    /* Action Buttons */
    .action-buttons {
        display: flex;
        gap: 5px; 
        flex-wrap: wrap; 
    }
    
    .btn-update, .btn-status-toggle {
        border: none;
        border-radius: 6px;
        padding: 6px 10px;
        cursor: pointer;
        font-size: 13px;
        transition: 0.3s;
        color: white;
        white-space: nowrap;
    }

    .btn-update {
        background-color: #004aad;
    }

    .btn-update:hover {
        background-color: #003c8a;
    }

    .btn-status-toggle.deactivate {
        background-color: #d9534f; /* Red */
    }

    .btn-status-toggle.deactivate:hover {
        background-color: #b94642;
    }
    
    .btn-status-toggle.reactivate {
        background-color: #28a745; /* Green */
    }

    .btn-status-toggle.reactivate:hover {
        background-color: #218838;
    }

    /* --- Pagination Styles --- */
    .pagination-controls {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        padding: 15px 5%;
        gap: 10px;
        background-color: white;
        width: 90%;
        margin: 0 auto;
        border-radius: 0 0 10px 10px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
        border-top: 1px solid #e0e0e0;
    }
    .pagination-controls button {
        background: #004aad;
        border: none;
        color: #fff;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s;
    }
    .pagination-controls button:disabled {
        background: #ccc;
        cursor: not-allowed;
    }
    .pagination-controls span {
        margin: 0 10px;
        font-weight: 500;
        font-size: 14px;
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
        justify-content: center;
        align-items: center;
    }

    .popup-content {
        background-color: #fff;
        margin: 8% auto;
        padding: 25px;
        border-radius: 10px;
        width: 400px;
        max-width: 90%;
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

    .popup-content input, .popup-content select {
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
                <button class="btn-add" id="addEmployeeBtn"><i class="fas fa-plus"></i> Add Employee</button>
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
                <th>Status</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody id="employee-table-body">
            <tr><td colspan="8" style="text-align:center;">Loading employee data...</td></tr>
        </tbody>
    </table>
    
    <div class="pagination-controls">
        <button id="prevPageBtn" disabled>Previous</button>
        <span id="pageInfo">Page 1 of 1</span>
        <button id="nextPageBtn" disabled>Next</button>
    </div>

    <div id="addPopup" class="popup" style="display: none;">
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

    <div id="updatePopup" class="popup" style="display: none;">
        <div class="popup-content">
            <h2>Update Employee</h2>
            <form id="updateForm">
                <input type="hidden" id="updateStaffId">
                <label>Staff Name</label>
                <input type="text" id="updateName" required>
                <label>Age</label>
                <input type="number" id="updateAge">
                <label>Address</label>
                <input type="text" id="updateAddress">
                <label>Phone Number</label>
                <input type="text" id="updatePhone">
                <label>Salary</label>
                <input type="number" step="0.01" id="updateSalary">
                <div class="popup-buttons">
                    <button type="button" class="btn-cancel" id="updateCancelBtn">Cancel</button>
                    <button type="submit" class="btn-save">Save Changes</button>
                </div>
            </form>
        </div>
    </div>

    <script type="module">
        // 🔑 FIX: Correct relative path to api.js
        import { API_BASE_URL } from '../api.js';

        // --- GLOBAL STATE & ELEMENTS ---
        const tableBody = document.getElementById('employee-table-body');
        const sortSelect = document.getElementById('sort-select');
        const prevPageBtn = document.getElementById('prevPageBtn');
        const nextPageBtn = document.getElementById('nextPageBtn');
        const pageInfoSpan = document.getElementById('pageInfo');
        
        const loggedInUser = JSON.parse(localStorage.getItem('laundroUser'));
        
        const addPopup = document.getElementById('addPopup');
        const updatePopup = document.getElementById('updatePopup');
        const addForm = document.getElementById('addForm');
        const updateForm = document.getElementById('updateForm');

        let currentStaffId = null;
        let currentPage = 1;
        const ROWS_PER_PAGE = 10;
        let totalEmployees = 0;
        const COLSPAN = 8; 
        
        document.getElementById('addEmployeeBtn').addEventListener('click', () => addPopup.style.display = 'flex');
        document.getElementById('addCancelBtn').addEventListener('click', () => { addForm.reset(); addPopup.style.display = 'none'; });
        document.getElementById('updateCancelBtn').addEventListener('click', () => updatePopup.style.display = 'none');
        
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) fetchEmployees(sortSelect.value, currentPage - 1);
        });

        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(totalEmployees / ROWS_PER_PAGE);
            if (currentPage < totalPages) fetchEmployees(sortSelect.value, currentPage + 1);
        });
        
        const updatePaginationControls = () => {
            const totalPages = Math.ceil(totalEmployees / ROWS_PER_PAGE);
            const displayPage = totalPages > 0 ? currentPage : 1;
            const displayTotal = totalPages > 0 ? totalPages : 1;
            
            pageInfoSpan.textContent = `Page ${displayPage} of ${displayTotal} (Total: ${totalEmployees})`;
            prevPageBtn.disabled = currentPage === 1;
            nextPageBtn.disabled = currentPage >= totalPages || totalPages === 0;
        };
        
        const renderTable = (employees) => {
            tableBody.innerHTML = '';
            if (!employees || employees.length === 0) {
                const message = totalEmployees > 0 ? 
                    'No employees found on this page.' : 
                    'No employees found.';
                tableBody.innerHTML = `<tr><td colspan="${COLSPAN}" style="text-align:center;">${message}</td></tr>`;
                updatePaginationControls(); 
                return;
            }

            employees.forEach(emp => {
                const isActive = emp.IsActive === 1;
                const statusText = isActive ? 'Active' : 'Deactivated';
                const statusClass = isActive ? 'status-active' : 'status-inactive';
                const buttonClass = isActive ? 'deactivate' : 'reactivate';
                const buttonText = isActive ? 'Deactivate' : 'Reactivate';
                const buttonAction = isActive ? 0 : 1;
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${emp.StaffID}</td>
                    <td>${emp.StaffName}</td>
                    <td>${emp.StaffAge || 'N/A'}</td>
                    <td>${emp.StaffAddress || 'N/A'}</td>
                    <td>${emp.StaffCellNo || 'N/A'}</td>
                    <td>₱${parseFloat(emp.StaffSalary || 0).toFixed(2)}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-update">Update</button>
                            <button class="btn-status-toggle ${buttonClass}" data-staff-id="${emp.StaffID}" data-action="${buttonAction}">
                                ${buttonText}
                            </button>
                        </div>
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
                    updatePopup.style.display = 'flex';
                });

                row.querySelector('.btn-status-toggle').addEventListener('click', handleStatusToggle);

                tableBody.appendChild(row);
            });
            updatePaginationControls();
        };

        const fetchEmployees = async (sortBy = 'newest', page = 1) => {
            if (!loggedInUser || !loggedInUser.ShopID) {
                tableBody.innerHTML = `<tr><td colspan="${COLSPAN}" style="text-align:center;">Error: Shop ID not found. Please log in again.</td></tr>`;
                return;
            }
            currentPage = page;
            const offset = (currentPage - 1) * ROWS_PER_PAGE;
            
            tableBody.innerHTML = `<tr><td colspan="${COLSPAN}" style="text-align:center;">Loading...</td></tr>`;
            
            try {
                const shopId = loggedInUser.ShopID;
                
                const response = await fetch(`${API_BASE_URL}/users/staff/${shopId}?sortBy=${sortBy}&limit=${ROWS_PER_PAGE}&offset=${offset}`);
                if (!response.ok) throw new Error('Failed to fetch employees');
                
                const data = await response.json();
                
                // 🔑 KEY FIX: Handle { staff: [], totalCount: N } response structure
                const employees = data.staff || []; 
                totalEmployees = data.totalCount || 0; 

                renderTable(employees);
                
            } catch (error) {
                console.error('Fetch error:', error);
                tableBody.innerHTML = `<tr><td colspan="${COLSPAN}" style="text-align:center;">Error loading employees.</td></tr>`;
                totalEmployees = 0;
                updatePaginationControls();
            }
        };

        async function handleStatusToggle(e) {
            const button = e.target.closest('.btn-status-toggle');
            const staffId = button.dataset.staffId;
            const action = parseInt(button.dataset.action); 
            const actionText = action === 1 ? 'Reactivate' : 'Deactivate';
            const staffName = button.closest('tr').cells[1].textContent;

            if (window.confirm(`Are you sure you want to ${actionText} ${staffName} (${staffId})?`)) {
                try {
                    const response = await fetch(`${API_BASE_URL}/users/${staffId}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ IsActive: action })
                    });
                    
                    const result = await response.json();

                    if (response.ok && result.success) {
                        window.alert(result.message || `Employee ${staffName} successfully ${actionText}d.`);
                        fetchEmployees(sortSelect.value, currentPage); 
                    } else {
                         window.alert(result.message || `Error toggling status.`);
                    }

                } catch (error) {
                    console.error("Status Toggle Error:", error);
                    window.alert(`Network error: Failed to ${actionText} employee.`);
                }
            }
        }
        
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
                fetchEmployees(sortSelect.value, 1); 
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
                fetchEmployees(sortSelect.value, currentPage); 
            } catch (error) {
                console.error('Update employee error:', error);
                alert(`Error: ${error.message}`);
            }
        });

        document.addEventListener('DOMContentLoaded', () => {
            sortSelect.addEventListener('change', () => {
                fetchEmployees(sortSelect.value, 1);
            });
            fetchEmployees(); 
        });
    </script>
</body>
</html>