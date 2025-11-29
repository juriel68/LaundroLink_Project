<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Employees - LaundroLink</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<style>
    /* --- BASE STYLES --- */
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

    /* Role Badge */
    .role-badge {
        background: #eef; 
        color: #004aad; 
        padding: 2px 8px; 
        border-radius: 4px; 
        font-size: 12px; 
        font-weight: bold; 
        border: 1px solid #cce5ff;
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
            </div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Staff ID</th>
                <th>Staff Name</th>
                <th>Role</th> <th>Age</th>
                <th>Address</th>
                <th>Phone Number</th>
                <th>Salary</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody id="employee-table-body">
            <tr><td colspan="9" style="text-align:center;">Loading employee data...</td></tr>
        </tbody>
    </table>
    
    <div class="pagination-controls">
        <button id="prevPageBtn" disabled>Previous</button>
        <span id="pageInfo">Page 1 of 1</span>
        <button id="nextPageBtn" disabled>Next</button>
    </div>


    <script type="module">
        import { API_BASE_URL } from '../api.js';

        // --- GLOBAL STATE & ELEMENTS ---
        const tableBody = document.getElementById('employee-table-body');
        const sortSelect = document.getElementById('sort-select');
        const prevPageBtn = document.getElementById('prevPageBtn');
        const nextPageBtn = document.getElementById('nextPageBtn');
        const pageInfoSpan = document.getElementById('pageInfo');
        
        // Read logged-in user data from storage
        const loggedInUser = JSON.parse(localStorage.getItem('laundroUser'));

        let currentStaffId = null;
        let currentPage = 1;
        const ROWS_PER_PAGE = 10;
        let totalEmployees = 0;
        const COLSPAN = 9; 
        
        
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) fetchEmployees(sortSelect.value, currentPage - 1);
        });

        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(totalEmployees / ROWS_PER_PAGE);
            if (currentPage < totalPages) fetchEmployees(sortSelect.value, currentPage + 1);
        });
        
        // --- CORE FUNCTIONS ---

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
                // Determine status
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
                    <td><span class="role-badge">${emp.StaffRole || 'Staff'}</span></td>
                    <td>${emp.StaffAge || 'N/A'}</td>
                    <td>${emp.StaffAddress || 'N/A'}</td>
                    <td>${emp.StaffCellNo || 'N/A'}</td>
                    <td>₱${parseFloat(emp.StaffSalary || 0).toFixed(2)}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                `;
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
                
                const employees = Array.isArray(data.staff) ? data.staff : []; 
                totalEmployees = data.totalCount || 0; 

                renderTable(employees);
                
            } catch (error) {
                console.error('Fetch error:', error);
                tableBody.innerHTML = `<tr><td colspan="${COLSPAN}" style="text-align:center;">Error loading employees.</td></tr>`;
                totalEmployees = 0;
                updatePaginationControls();
            }
        };

        // --- INITIALIZATION ---
        document.addEventListener('DOMContentLoaded', () => {
            sortSelect.addEventListener('change', () => {
                fetchEmployees(sortSelect.value, 1);
            });
            fetchEmployees(); 
        });
    </script>
</body>
</html>