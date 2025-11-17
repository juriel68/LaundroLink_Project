<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manage Users</title>
    <style>
        /* --- FONT FIX: Applied the consistent font stack --- */
        body, .manage-users-container, .modal-content {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f9fbfd; /* Match main content background */
            margin: 0;
            padding: 0;
        }
        .manage-users-container {
            padding: 20px;
        }

        .page-title {
            font-size: 26px;
            color: #023e8a;
            margin-bottom: 10px;
        }

        .subtitle {
            color: #6c757d;
            margin-bottom: 25px;
        }

        .card-container {
            display: flex;
            flex-direction: column;
            gap: 18px;
        }

        .role-card {
            padding: 22px;
            border-radius: 14px;
            color: #333; 
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .role-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 14px rgba(0,0,0,0.15);
        }

        .shop-owner { 
            background: linear-gradient(90deg, #7b2ff7, #f107a3); 
            color: #fff; 
        }
        .customer { 
            background: linear-gradient(90deg, #00796B, #38ef7d); 
        }
        .staff { 
            background: linear-gradient(90deg, #E65100, #FBC02D); 
        }

        .card-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 6px;
        }

        /* --- TABLE SECTION --- */
        .table-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            margin-top: 30px;
            padding: 25px;
        }

        #tableTitle {
            font-size: 20px;
            font-weight: 600;
            color: #023e8a;
            margin-bottom: 15px;
        }

        .table-controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            flex-wrap: wrap;
            gap: 10px;
        }

        .search-container input {
            padding: 8px 12px;
            border: 1px solid #ccc;
            border-radius: 6px;
            width: 250px;
            font-size: 14px;
        }

        .pagination-controls button {
            background: #0077b6;
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


        .styled-table {
            width: 100%;
            border-collapse: collapse;
        }

        .styled-table th, .styled-table td {
            padding: 14px 18px;
            text-align: left;
            border-bottom: 1px solid #eee;
            font-size: 14px;
            vertical-align: middle;
        }

        .styled-table th {
            background: #0077b6;
            color: white;
            font-weight: 600;
        }

        .styled-table tr:last-child td {
            border-bottom: none;
        }

        /* --- ACTION BUTTONS FIX --- */
        .action-buttons {
            display: flex;
            gap: 5px; /* Small space between the buttons */
        }
        
        .update-btn, .status-btn { 
            border: none;
            border-radius: 6px;
            padding: 6px 10px; /* Reduced padding slightly for fit */
            cursor: pointer;
            font-size: 13px;
            color: white;
            /* margin-left: 5px; REMOVED this margin, replaced by gap */
            white-space: nowrap; /* Prevent button text from wrapping */
        }

        .update-btn { background: #0077b6; }
        .update-btn:hover { background: #005f87; }

        .status-btn.deactivate { background: #e63946; }
        .status-btn.deactivate:hover { background: #c1121f; }
        .status-btn.reactivate { background: #28a745; }
        .status-btn.reactivate:hover { background: #218838; }
        
        .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }
        .status-active { background: #d4edda; color: #155724; }
        .status-inactive { background: #f8d7da; color: #721c24; }


        .back-btn {
            background: #0077b6;
            border: none;
            color: #fff;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            margin-bottom: 15px;
        }

        .back-btn:hover {
            background: #005f87;
        }

        .create-btn {
            background: #28a745;
            border: none;
            color: white;
            padding: 10px 18px;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            margin-bottom: 15px;
            margin-left: 10px;
        }

        .create-btn:hover {
            background: #218838;
        }

        /* --- MODAL STYLES --- */
        .modal {
            display: none; 
            position: fixed;
            z-index: 1000; 
            left: 0; top: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.6); 
            justify-content: center;
            align-items: center;
        }

        .modal-content {
            background: #fff;
            padding: 25px 30px;
            border-radius: 10px;
            width: 350px;
            max-width: 90%;
            box-shadow: 0 6px 20px rgba(0,0,0,0.2);
            position: relative;
            animation: fadeIn 0.2s ease-in-out;
        }

        .modal-content h3 {
            margin-bottom: 18px;
            color: #023e8a;
        }

        .modal-content label {
            font-size: 14px;
            font-weight: 500;
            margin-top: 10px;
            display: block;
        }

        .modal-content input, .modal-content select {
            width: 100%;
            padding: 8px;
            margin-top: 5px;
            border: 1px solid #ddd;
            border-radius: 6px;
        }

        .submit-btn {
            background: #0077b6;
            color: #fff;
            border: none;
            padding: 10px 15px;
            border-radius: 6px;
            cursor: pointer;
            margin-top: 15px;
            width: 100%;
        }

        .submit-btn:hover {
            background: #005f87;
        }

        .close-modal {
            position: absolute;
            top: 12px;
            right: 15px;
            cursor: pointer;
            font-size: 20px;
            color: #888;
        }

        .close-modal:hover {
            color: #000;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }

        /* Responsive adjustments */
        @media (min-width: 768px) {
            .card-container {
                flex-direction: row;
            }
            .role-card {
                flex: 1;
            }
        }
    </style>
</head>
<body>

<div class="manage-users-container">
    <h2 class="page-title">Manage Users</h2>
    <p class="subtitle">User details and verification</p>

    <div class="card-container">
        <div class="role-card shop-owner" data-role="Shop Owner">
            <div class="card-title">👑 Manage Shop Owner</div>
            <p>View details and manage shop owner accounts.</p>
        </div>

        <div class="role-card customer" data-role="Customer">
            <div class="card-title">👥 Manage Customer</div>
            <p>See customer-specific information and history.</p>
        </div>

        <div class="role-card staff" data-role="Staff">
            <div class="card-title">👷 Manage Staff</div>
            <p>View staff details and assigned shops.</p>
        </div>
    </div>

    <div class="table-container" id="userTableContainer" style="display:none;">
        <div class="table-controls">
            <div>
                <button id="backBtn" class="back-btn" style="display:none;">← Back to Roles</button>
                <button id="createShopOwnerBtn" class="create-btn" style="display:none;">+ Create Shop Owner</button>
            </div>
            <div class="search-container">
                <input type="text" id="searchInput" placeholder="Search by User ID or Name..." />
            </div>
        </div>
        
        <h3 id="tableTitle"></h3> 
        
        <table class="styled-table">
            <thead>
                <tr>
                    <th>UserID</th>
                    <th>Email</th>
                    <th class="owner-col">Owner Name</th>
                    <th class="owner-col">Phone</th>
                    <th class="owner-col">Address</th>
                    <th>Date Created</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="users-table-body"></tbody>
        </table>

        <div class="pagination-controls">
            <button id="prevPageBtn" disabled>Previous</button>
            <span id="pageInfo">Page 1 of 1</span>
            <button id="nextPageBtn" disabled>Next</button>
        </div>
    </div>
</div>

<div id="createAccountModal" class="modal">
    <div class="modal-content">
        <span class="close-modal create-close">&times;</span>
        <h3>Create Shop Owner Account</h3>
        <form id="createAccountForm">
            <label>Email:</label>
            <input type="email" id="emailInput" required />

            <label>Password:</label>
            <input type="password" id="passwordInput" required minlength="6" />

            <label>Re-enter Password:</label>
            <input type="password" id="rePasswordInput" required minlength="6" />

            <label>Owner Name:</label>
            <input type="text" id="ownerNameInput" required />

            <label>Phone:</label>
            <input type="text" id="ownerPhoneInput" />

            <label>Address:</label>
            <input type="text" id="ownerAddressInput" />
            <p id="errorMsg" style="color:red; display:none;"></p>
            <button type="submit" class="submit-btn">Create Account</button>
        </form>
    </div>
</div>

<div id="updateUserModal" class="modal">
    <div class="modal-content">
        <span class="close-modal update-close">&times;</span>
        <h3 id="updateModalTitle">Update User Details</h3> 
        <form id="updateUserForm">
            <p><strong>UserID:</strong> <span id="updateUserIdDisplay"></span></p>

            <label for="updateEmailInput">Email:</label>
            <input type="email" id="updateEmailInput" required />
            
            <div id="ownerDetailsFields">
                <label for="updateOwnerNameInput">Owner Name:</label>
                <input type="text" id="updateOwnerNameInput" required />

                <label for="updateOwnerPhoneInput">Phone:</label>
                <input type="text" id="updateOwnerPhoneInput" />

                <label for="updateOwnerAddressInput">Address:</label>
                <input type="text" id="updateOwnerAddressInput" />
            </div>
            
            <p id="updateErrorMsg" style="color:red; display:none;"></p>
            <button type="submit" class="submit-btn">Save Changes</button>
        </form>
    </div>
</div>

<script type="module">
// NOTE: Make sure your '../api.js' file exports the API_BASE_URL constant
import { API_BASE_URL } from '../api.js'; 

// ===================================================================
// GLOBAL STATE & CONSTANTS
// ===================================================================

let allUsersData = []; // Stores the full, unfiltered user list
let filteredUsersData = []; // Stores the list after filtering (but before pagination)
let currentPage = 1;
const ROWS_PER_PAGE = 10; 

// ===================================================================
// DATE FORMATTING FUNCTION 
// ===================================================================
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        
        if (isNaN(date.getTime())) return dateString;

        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        };
        return date.toLocaleDateString(undefined, options);

    } catch (e) {
        console.error("Date formatting error:", e);
        return dateString; 
    }
}

// ===================================================================
// ELEMENT SELECTION
// ===================================================================

const roleCards = document.querySelectorAll('.role-card');
const tableContainer = document.getElementById('userTableContainer');
const tableBody = document.getElementById('users-table-body');
const tableTitle = document.getElementById('tableTitle');
const cardContainer = document.querySelector('.card-container');
const backBtn = document.getElementById('backBtn');
const createBtn = document.getElementById('createShopOwnerBtn');
const tableHeaders = document.querySelectorAll('.styled-table th'); 
const ownerColumns = document.querySelectorAll('.owner-col'); 
const searchInput = document.getElementById('searchInput');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageInfoSpan = document.getElementById('pageInfo');

// Create Modal Elements
const createModal = document.getElementById('createAccountModal');
const createCloseBtn = createModal.querySelector('.create-close');
const createForm = document.getElementById('createAccountForm');
const errorMsg = document.getElementById('errorMsg');

// Update Modal Elements 
const updateModal = document.getElementById('updateUserModal');
const updateCloseBtn = updateModal.querySelector('.update-close');
const updateUserForm = document.getElementById('updateUserForm');
const updateUserIdDisplay = document.getElementById('updateUserIdDisplay');
const updateEmailInput = document.getElementById('updateEmailInput');
const updateErrorMsg = document.getElementById('updateErrorMsg');

const updateModalTitle = document.getElementById('updateModalTitle');
const ownerDetailsFields = document.getElementById('ownerDetailsFields');
const updateOwnerNameInput = document.getElementById('updateOwnerNameInput');
const updateOwnerPhoneInput = document.getElementById('updateOwnerPhoneInput');
const updateOwnerAddressInput = document.getElementById('updateOwnerAddressInput');

let currentUpdatingUserId = null;
let currentUpdatingUserRole = null;
let currentRole = null; // Track the currently viewed role

// ===================================================================
// MAIN NAVIGATION & DATA FETCHING
// ===================================================================

// === Handle Card Clicks ===
roleCards.forEach(card => {
    card.addEventListener('click', async () => {
        const role = card.dataset.role;
        currentRole = role; // Set the current role
        
        // 1. Toggle visibility
        cardContainer.style.display = 'none';
        backBtn.style.display = 'inline-block';
        tableContainer.style.display = 'block';
        
        // 2. Set title and create button
        tableTitle.textContent = `${role}s`;
        const isOwner = role === 'Shop Owner';
        createBtn.style.display = isOwner ? 'inline-block' : 'none';
        
        // 3. Toggle owner columns visibility and add new Status header
        let ownerColCount = 0;
        tableHeaders.forEach(header => {
            if (header.classList.contains('owner-col')) {
                header.style.display = isOwner ? '' : 'none'; 
                if (isOwner) ownerColCount++;
            }
        });
        
        // Get the Status header index (which is before Actions)
        const statusHeader = tableHeaders[6]; // Index 6 is 'Status'
        const actionsHeader = tableHeaders[7]; // Index 7 is 'Actions'
        
        statusHeader.style.display = 'table-cell'; // Status is always visible
        actionsHeader.style.display = 'table-cell'; // Actions is always visible

        // 4. Reset search and pagination state and fetch all data
        searchInput.value = '';
        currentPage = 1;
        await fetchUsers(role);
    });
});

// === Back Button ===
backBtn.addEventListener('click', () => {
    cardContainer.style.display = 'flex';
    tableContainer.style.display = 'none';
    backBtn.style.display = 'none';
    createBtn.style.display = 'none';
    currentRole = null;
});

// === Fetch All Users from API (for a given role) ===
async function fetchUsers(role) {
    const isOwner = role === 'Shop Owner';
    const colspan = isOwner ? 8 : 5; // Updated colspan count (UserID, Email, DateCreated, Status, Actions + 3 owner cols)
    
    tableBody.innerHTML = `<tr><td colspan="${colspan}">Loading...</td></tr>`;

    try {
        let apiUrl = `${API_BASE_URL}/users`;
        
        if (isOwner) {
            apiUrl = `${API_BASE_URL}/users/owners`;
        }
        
        const response = await fetch(apiUrl); 
        if (!response.ok) throw new Error(`Failed to fetch ${role}s`);
        const data = await response.json();

        const users = (Array.isArray(data) ? data : data.data || data.users || []).map(u => ({
            UserID: u.UserID || u.user_id || u.id,
            UserEmail: u.UserEmail || u.user_email || u.email,
            UserRole: u.UserRole || u.user_role || u.role,
            DateCreated: u.DateCreated || u.date_created || '',
            IsActive: (u.IsActive === 1 || u.IsActive === true), // ASSUME IsActive is returned
            
            OwnerName: u.OwnerName || u.owner_name || 'N/A',
            OwnerPhone: u.OwnerPhone || u.owner_phone || 'N/A',
            OwnerAddress: u.OwnerAddress || u.owner_address || 'N/A',

            // Use the most relevant name field for searching
            SearchName: (isOwner ? u.OwnerName : (u.CustName || u.StaffName || u.UserEmail)) || ''
        }));

        let rawUserList = users;
        
        if (!isOwner) {
            rawUserList = users.filter(
                u => (u.UserRole || '').toLowerCase() === role.toLowerCase()
            );
        }

        allUsersData = rawUserList;
        applyFiltersAndPagination();

    } catch (err) {
        console.error(err);
        tableBody.innerHTML = `<tr><td colspan="${colspan}">Error: ${err.message}</td></tr>`;
    }
}

// ===================================================================
// FILTERING AND PAGINATION LOGIC
// ===================================================================

function applyFiltersAndPagination() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    // 1. Filtering
    if (searchTerm) {
        filteredUsersData = allUsersData.filter(user => {
            const nameMatch = user.SearchName.toLowerCase().includes(searchTerm);
            const idMatch = user.UserID.toLowerCase().includes(searchTerm);
            return nameMatch || idMatch;
        });
    } else {
        filteredUsersData = allUsersData;
    }

    // Reset page if filtering changes the total count drastically
    const totalPages = Math.ceil(filteredUsersData.length / ROWS_PER_PAGE);
    if (currentPage > totalPages) {
        currentPage = totalPages > 0 ? totalPages : 1;
    }

    // 2. Pagination
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    const end = start + ROWS_PER_PAGE;
    const paginatedUsers = filteredUsersData.slice(start, end);

    // 3. Rendering
    renderTable(paginatedUsers, currentRole);
    updatePaginationControls(totalPages);
}

// === Render Table ===
function renderTable(users, role) {
    const isOwner = role === 'Shop Owner';
    const colspan = isOwner ? 8 : 5; // Updated colspan count

    if (!users || users.length === 0) {
        const message = filteredUsersData.length > 0 ? 
            `<tr><td colspan="${colspan}">No results on this page.</td></tr>` : 
            `<tr><td colspan="${colspan}">No ${role.toLowerCase()}s found.</td></tr>`;
        tableBody.innerHTML = message;
        return;
    }

    tableBody.innerHTML = users.map(user => {
        const isActive = user.IsActive;
        const statusText = isActive ? 'Active' : 'Deactivated';
        const statusClass = isActive ? 'status-active' : 'status-inactive';
        const buttonClass = isActive ? 'deactivate' : 'reactivate';
        const buttonText = isActive ? 'Deactivate' : 'Reactivate';

        return `
        <tr data-user-id="${user.UserID}" 
            data-user-email="${user.UserEmail}" 
            data-user-role="${user.UserRole}"
            data-is-active="${user.IsActive}">
            <td>${user.UserID}</td>
            <td>${user.UserEmail}</td>
            
            ${isOwner ? `
            <td>${user.OwnerName}</td>
            <td>${user.OwnerPhone}</td>
            <td>${user.OwnerAddress}</td>
            ` : ''}

            <td>${formatDate(user.DateCreated)}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="update-btn">Update</button>
                    <button class="status-btn ${buttonClass}" data-action="${isActive ? 0 : 1}">
                        ${buttonText}
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('');

    attachEventListeners();
}

// === Update Pagination Controls ===
function updatePaginationControls(totalPages) {
    pageInfoSpan.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage >= totalPages;
}

// === Pagination Button Handlers ===
prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        applyFiltersAndPagination();
    }
});

nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredUsersData.length / ROWS_PER_PAGE);
    if (currentPage < totalPages) {
        currentPage++;
        applyFiltersAndPagination();
    }
});

// === Search Input Handler ===
searchInput.addEventListener('input', () => {
    currentPage = 1; // Reset to page 1 on new search term
    applyFiltersAndPagination();
});


// ===================================================================
// BUTTON EVENT LISTENERS (UPDATE AND STATUS TOGGLE)
// ===================================================================

function attachEventListeners() {
    // Update button click handler (remains the same)
    document.querySelectorAll('.update-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            
            const userId = row.dataset.userId;
            const email = row.dataset.userEmail;
            const role = row.dataset.userRole; 
            
            currentUpdatingUserId = userId; 
            currentUpdatingUserRole = role;

            updateUserIdDisplay.textContent = userId;
            updateEmailInput.value = email;
            updateErrorMsg.style.display = 'none';

            const isOwner = role === 'Shop Owner';
            updateModalTitle.textContent = isOwner ? 'Update Shop Owner Details' : `Update ${role} Details`;
            ownerDetailsFields.style.display = isOwner ? 'block' : 'none';

            if (isOwner) {
                const ownerData = allUsersData.find(u => u.UserID === userId);
                updateOwnerNameInput.value = ownerData.OwnerName;
                updateOwnerPhoneInput.value = ownerData.OwnerPhone === 'N/A' ? '' : ownerData.OwnerPhone; 
                updateOwnerAddressInput.value = ownerData.OwnerAddress === 'N/A' ? '' : ownerData.OwnerAddress;
            } else {
                updateOwnerNameInput.value = '';
                updateOwnerPhoneInput.value = '';
                updateOwnerAddressInput.value = '';
            }
            
            updateModal.style.display = 'flex';
        });
    });

    // Status Button (Deactivate/Reactivate) click handler
    document.querySelectorAll('.status-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const row = e.target.closest('tr');
            const userId = row.dataset.userId;
            const action = parseInt(button.dataset.action); // 1 for Activate, 0 for Deactivate
            const actionText = action === 1 ? 'Reactivate' : 'Deactivate';
            
            if (window.confirm(`Are you sure you want to ${actionText} user ${userId}?`)) {
                try {
                    // Call a new backend endpoint for toggling status
                    const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ IsActive: action }) 
                    });
                    
                    const result = await response.json();

                    if (response.ok && result.success) {
                        window.alert(result.message || `User ${userId} successfully ${actionText}d.`);
                        // Refresh the current table view
                        await fetchUsers(currentRole); 
                    } else {
                         window.alert(result.message || `Error toggling user status.`);
                    }

                } catch (error) {
                    console.error("Status Toggle Error:", error);
                    window.alert(`Network error: Failed to ${actionText} user.`);
                }
            }
        });
    });
}

// ===================================================================
// MODAL LOGIC (COMMON, UPDATE, CREATE)
// ===================================================================

// Close button for Update Modal
updateCloseBtn.addEventListener('click', () => {
    updateModal.style.display = 'none';
});

// Update Form Submission
updateUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const isOwner = currentUpdatingUserRole === 'Shop Owner';
    const updatedEmail = updateEmailInput.value.trim();
    
    updateErrorMsg.style.display = 'none';
    
    if (!currentUpdatingUserId) {
        updateErrorMsg.textContent = 'Error: User ID not found.';
        updateErrorMsg.style.display = 'block';
        return;
    }

    let apiUrl;
    let payload;

    if (isOwner) {
        // --- SHOP OWNER UPDATE (Email + Details) ---
        apiUrl = `${API_BASE_URL}/users/owner/${currentUpdatingUserId}`;
        payload = {
            UserEmail: updatedEmail,
            OwnerName: updateOwnerNameInput.value,
            OwnerPhone: updateOwnerPhoneInput.value,
            OwnerAddress: updateOwnerAddressInput.value
        };
    } else {
        // --- CUSTOMER/STAFF UPDATE (Email Only) ---
        apiUrl = `${API_BASE_URL}/users/${currentUpdatingUserId}`; 
        payload = { UserEmail: updatedEmail, UserRole: currentUpdatingUserRole };
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        const successMsg = isOwner ? 'Shop Owner details updated.' : `${currentUpdatingUserRole} details updated.`;

        if (response.ok && result.success) {
            window.alert(result.message || `✅ ${successMsg}`);
            updateModal.style.display = 'none';
            
            // Refresh the current table view (resets pagination internally)
            await fetchUsers(currentRole);
        } else {
            updateErrorMsg.textContent = result.message || 'Error updating user details.';
            updateErrorMsg.style.display = 'block';
        }
    } catch (error) {
        console.error("Update User Details Error:", error);
        updateErrorMsg.textContent = 'Network error while saving changes.';
        updateErrorMsg.style.display = 'block';
    }
});


// ===================================================================
// CREATE MODAL LOGIC (Shop Owner)
// ===================================================================

createBtn.addEventListener('click', () => {
    createModal.style.display = 'flex'; 
    errorMsg.style.display = 'none';
    createForm.reset();
});

createCloseBtn.addEventListener('click', () => {
    createModal.style.display = 'none';
});

// Handle clicking outside the modal
window.addEventListener('click', (e) => {
    if (e.target === createModal || e.target === updateModal) {
        e.target.style.display = 'none';
    }
});

createForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Retrieve form data
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    const rePassword = document.getElementById('rePasswordInput').value;
    const ownerName = document.getElementById('ownerNameInput').value;
    const ownerPhone = document.getElementById('ownerPhoneInput').value;
    const ownerAddress = document.getElementById('ownerAddressInput').value;


    if (password !== rePassword) {
        errorMsg.textContent = "Passwords do not match!";
        errorMsg.style.display = 'block';
        return;
    }
    
    errorMsg.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/owner`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                UserEmail: email, 
                UserPassword: password,
                OwnerName: ownerName,
                OwnerPhone: ownerPhone,
                OwnerAddress: ownerAddress 
            })
        });
        
        const result = await response.json();

        if (response.ok && result.success) {
            window.alert(`✅ Shop Owner Account Created Successfully!\nUserID: ${result.userId}`);
            createModal.style.display = 'none';
            
            // Refresh and reset to page 1
            currentPage = 1;
            await fetchUsers('Shop Owner'); 
        } else {
            errorMsg.textContent = result.message || 'Failed to create account.';
            errorMsg.style.display = 'block';
        }

    } catch (err) {
        console.error("Create Owner Error:", err);
        errorMsg.textContent = 'Network error: Failed to connect to server.';
        errorMsg.style.display = 'block';
    }
});
</script>
</body>
</html>