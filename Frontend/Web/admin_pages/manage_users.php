<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manage Users</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        /* --- BASE STYLES --- */
        body, .manage-users-container, .modal-content {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f9fbfd;
            margin: 0;
            padding: 0;
        }
        .manage-users-container { padding: 20px; }
        .page-title { font-size: 26px; color: #023e8a; margin-bottom: 10px; }
        .subtitle { color: #6c757d; margin-bottom: 25px; }

        /* --- CARDS --- */
        .card-container { display: flex; flex-direction: column; gap: 18px; }
        .role-card { padding: 22px; border-radius: 14px; color: #333; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .role-card:hover { transform: translateY(-3px); box-shadow: 0 6px 14px rgba(0,0,0,0.15); }
        .shop-owner { background: linear-gradient(90deg, #7b2ff7, #f107a3); color: #fff; }
        .customer { background: linear-gradient(90deg, #00796B, #38ef7d); }
        .staff { background: linear-gradient(90deg, #E65100, #FBC02D); }
        .card-title { font-size: 20px; font-weight: bold; margin-bottom: 6px; }

        /* --- TABLE --- */
        .table-container { background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-top: 30px; padding: 25px; }
        #tableTitle { font-size: 20px; font-weight: 600; color: #023e8a; margin-bottom: 15px; }
        .table-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px; }
        .search-container input { padding: 8px 12px; border: 1px solid #ccc; border-radius: 6px; width: 250px; font-size: 14px; }
        
        .styled-table { width: 100%; border-collapse: collapse; }
        .styled-table th, .styled-table td { padding: 14px 18px; text-align: left; border-bottom: 1px solid #eee; font-size: 14px; vertical-align: middle; }
        .styled-table th { background: #0077b6; color: white; font-weight: 600; }

        /* --- BUTTONS --- */
        .action-buttons { display: flex; gap: 5px; }
        .update-btn, .status-btn { border: none; border-radius: 6px; padding: 6px 10px; cursor: pointer; font-size: 13px; color: white; white-space: nowrap; }
        .update-btn { background: #0077b6; } .update-btn:hover { background: #005f87; }
        .status-btn.deactivate { background: #e63946; } .status-btn.deactivate:hover { background: #c1121f; }
        .status-btn.reactivate { background: #28a745; } .status-btn.reactivate:hover { background: #218838; }
        
        .back-btn { background: #0077b6; border: none; color: #fff; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; margin-bottom: 15px; }
        .create-btn { background: #28a745; border: none; color: white; padding: 10px 18px; border-radius: 6px; font-size: 14px; cursor: pointer; margin-bottom: 15px; margin-left: 10px; }
        .create-btn:hover { background: #218838; }

        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
        .status-active { background: #d4edda; color: #155724; } .status-inactive { background: #f8d7da; color: #721c24; }

        /* --- MODALS --- */
        .modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); justify-content: center; align-items: center; }
        .modal-content { background: #fff; padding: 25px 30px; border-radius: 10px; width: 400px; max-width: 90%; box-shadow: 0 6px 20px rgba(0,0,0,0.2); position: relative; animation: fadeIn 0.2s ease-in-out; max-height: 90vh; overflow-y: auto; }
        .modal-content h3 { margin-bottom: 18px; color: #023e8a; }
        .modal-content label { font-size: 14px; font-weight: 500; margin-top: 10px; display: block; }
        .modal-content input, .modal-content select, .modal-content textarea { width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }
        
        .submit-btn { background: #0077b6; color: #fff; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer; margin-top: 15px; width: 100%; font-weight: 600; }
        .submit-btn:hover { background: #005f87; }
        .close-modal { position: absolute; top: 12px; right: 15px; cursor: pointer; font-size: 20px; color: #888; }

        .btn-pinpoint { background-color: #17a2b8; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-top: 5px; display: inline-flex; align-items: center; gap: 5px; }

        /* 🟢 IMAGE UPLOAD STYLES */
        .image-upload-area { display: flex; flex-direction: column; align-items: center; margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px; border: 1px dashed #ccc; }
        #shopImagePreview { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 10px; border: 2px solid #ddd; background: #e9ecef; }
        
        /* Pagination */
        .pagination-controls button { background: #0077b6; border: none; color: #fff; padding: 8px 12px; border-radius: 6px; cursor: pointer; }
        .pagination-controls button:disabled { background: #ccc; cursor: not-allowed; }
        .pagination-controls span { margin: 0 10px; font-size: 14px; }

        /* Responsive */
        @media (min-width: 768px) { .card-container { flex-direction: row; } .role-card { flex: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
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
        <h3>Step 1: Create Shop Owner</h3>
        <form id="createAccountForm">
            <label>Email:</label> <input type="email" id="emailInput" required />
            <label>Password:</label> <input type="password" id="passwordInput" required minlength="6" />
            <label>Re-enter Password:</label> <input type="password" id="rePasswordInput" required minlength="6" />
            <label>Owner Name:</label> <input type="text" id="ownerNameInput" required />
            <label>Phone:</label> <input type="text" id="ownerPhoneInput" />
            <label>Address:</label> <input type="text" id="ownerAddressInput" />
            <p id="errorMsg" style="color:red; display:none;"></p>
            <button type="submit" class="submit-btn">Next: Setup Shop →</button>
        </form>
    </div>
</div>

<div id="createShopModal" class="modal">
    <div class="modal-content">
        <h3>Step 2: Setup Shop Details</h3>
        <p style="font-size:13px; color:#666;">Linking shop to Owner: <strong id="shopOwnerIdDisplay"></strong></p>
        
        <form id="createShopForm">
            <label>Shop Logo / Image:</label>
            <div class="image-upload-area">
                <img id="shopImagePreview" src="https://placehold.co/100x100/e9ecef/ccc?text=Logo" alt="Shop Preview">
                <input type="file" id="shopImageFile" accept="image/*">
            </div>

            <label>Shop Name:</label> 
            <input type="text" id="shopNameInput" required />
            
            <label>Description:</label>
            <textarea id="shopDescrpInput" rows="2" required></textarea>

            <label>Address (City/Town, Province):</label>
            <input type="text" id="shopAddressInput" placeholder="e.g. Poblacion, Argao, Cebu" required />

            <label>Shop Phone:</label> 
            <input type="text" id="shopPhoneInput" required />

            <label>Opening Hours:</label> 
            <input type="text" id="shopHoursInput" placeholder="e.g. 8:00 AM - 9:00 PM" required />

            <p id="shopErrorMsg" style="color:red; display:none;"></p>
            <button type="submit" class="submit-btn" style="background-color: #28a745;">Complete Setup</button>
        </form>
    </div>
</div>

<div id="updateUserModal" class="modal">
    <div class="modal-content">
        <span class="close-modal update-close">&times;</span>
        <h3 id="updateModalTitle">Update User Details</h3> 
        <form id="updateUserForm">
            <p><strong>UserID:</strong> <span id="updateUserIdDisplay"></span></p>
            <label for="updateEmailInput">Email:</label> <input type="email" id="updateEmailInput" required />
            <div id="ownerDetailsFields">
                <label for="updateOwnerNameInput">Owner Name:</label> <input type="text" id="updateOwnerNameInput" required />
                <label for="updateOwnerPhoneInput">Phone:</label> <input type="text" id="updateOwnerPhoneInput" />
                <label for="updateOwnerAddressInput">Address:</label> <input type="text" id="updateOwnerAddressInput" />
            </div>
            <p id="updateErrorMsg" style="color:red; display:none;"></p>
            <button type="submit" class="submit-btn">Save Changes</button>
        </form>
    </div>
</div>

<script type="module">
import { API_BASE_URL } from '../api.js'; 

// --- STATE VARIABLES ---
let allUsersData = [];
let filteredUsersData = [];
let currentPage = 1;
const ROWS_PER_PAGE = 10; 

let currentRole = null;
let newlyCreatedOwnerID = null; 

// --- ELEMENTS ---
const roleCards = document.querySelectorAll('.role-card');
const tableContainer = document.getElementById('userTableContainer');
const tableBody = document.getElementById('users-table-body');
const tableTitle = document.getElementById('tableTitle');
const cardContainer = document.querySelector('.card-container');
const backBtn = document.getElementById('backBtn');
const createBtn = document.getElementById('createShopOwnerBtn');
const tableHeaders = document.querySelectorAll('.styled-table th'); 
const searchInput = document.getElementById('searchInput');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageInfoSpan = document.getElementById('pageInfo');

// --- NAVIGATION LOGIC ---
roleCards.forEach(card => {
    card.addEventListener('click', async () => {
        const role = card.dataset.role;
        currentRole = role;
        cardContainer.style.display = 'none';
        backBtn.style.display = 'inline-block';
        tableContainer.style.display = 'block';
        tableTitle.textContent = `${role}s`;
        
        const isOwner = role === 'Shop Owner';
        createBtn.style.display = isOwner ? 'inline-block' : 'none';
        
        tableHeaders.forEach(header => {
            if (header.classList.contains('owner-col')) header.style.display = isOwner ? '' : 'none';
        });
        
        searchInput.value = '';
        currentPage = 1;
        await fetchUsers(role);
    });
});

backBtn.addEventListener('click', () => {
    cardContainer.style.display = 'flex';
    tableContainer.style.display = 'none';
    backBtn.style.display = 'none';
    createBtn.style.display = 'none';
    currentRole = null;
});

// --- FETCH DATA ---
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

async function fetchUsers(role) {
    const isOwner = role === 'Shop Owner';
    const colspan = isOwner ? 8 : 5;
    tableBody.innerHTML = `<tr><td colspan="${colspan}" style="text-align:center;">Loading...</td></tr>`;

    try {
        const endpoint = isOwner ? '/users/owners' : '/users';
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        const data = await response.json();

        let users = (Array.isArray(data) ? data : data.data || []).map(u => ({
            UserID: u.UserID,
            UserEmail: u.UserEmail,
            UserRole: u.UserRole,
            DateCreated: u.DateCreated,
            // 🟢 FIX: Strict Boolean conversion for Status Toggle
            IsActive: (u.IsActive == 1 || u.IsActive === '1' || u.IsActive === true),
            OwnerName: u.OwnerName || 'N/A',
            OwnerPhone: u.OwnerPhone || 'N/A',
            OwnerAddress: u.OwnerAddress || 'N/A',
            SearchName: (isOwner ? u.OwnerName : (u.CustName || u.StaffName || u.UserEmail)) || ''
        }));

        if (!isOwner) users = users.filter(u => (u.UserRole || '').toLowerCase() === role.toLowerCase());

        allUsersData = users;
        applyFiltersAndPagination();
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="${colspan}" style="text-align:center;color:red;">Error: ${err.message}</td></tr>`;
    }
}

function applyFiltersAndPagination() {
    const term = searchInput.value.toLowerCase().trim();
    filteredUsersData = term ? allUsersData.filter(u => u.SearchName.toLowerCase().includes(term) || u.UserID.toLowerCase().includes(term)) : allUsersData;
    
    const totalPages = Math.ceil(filteredUsersData.length / ROWS_PER_PAGE) || 1;
    if (currentPage > totalPages) currentPage = 1;
    
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    const paginated = filteredUsersData.slice(start, start + ROWS_PER_PAGE);
    
    renderTable(paginated);
    pageInfoSpan.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage >= totalPages;
}

function renderTable(users) {
    const isOwner = currentRole === 'Shop Owner';
    if (!users.length) {
        tableBody.innerHTML = `<tr><td colspan="${isOwner ? 8 : 5}" style="text-align:center;">No results found.</td></tr>`;
        return;
    }
    
    tableBody.innerHTML = users.map(u => {
        const isActive = u.IsActive; 
        const statusText = isActive ? 'Active' : 'Deactivated';
        const statusClass = isActive ? 'status-active' : 'status-inactive';
        const buttonClass = isActive ? 'deactivate' : 'reactivate';
        const buttonText = isActive ? 'Deactivate' : 'Reactivate';
        // 🟢 FIX: Explicitly calculate action value
        const nextAction = isActive ? 0 : 1;

        return `
        <tr data-user-id="${u.UserID}" data-user-email="${u.UserEmail}" data-user-role="${u.UserRole}">
            <td>${u.UserID}</td>
            <td>${u.UserEmail}</td>
            ${isOwner ? `<td>${u.OwnerName}</td><td>${u.OwnerPhone}</td><td>${u.OwnerAddress}</td>` : ''}
            <td>${formatDate(u.DateCreated)}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="update-btn">Update</button>
                    <button class="status-btn ${buttonClass}" data-action="${nextAction}">${buttonText}</button>
                </div>
            </td>
        </tr>`;
    }).join('');
    
    attachRowListeners();
}

// --- MODAL LOGIC ---
const createModal = document.getElementById('createAccountModal');
const createShopModal = document.getElementById('createShopModal');
const updateModal = document.getElementById('updateUserModal');

// 1. OPEN CREATE OWNER MODAL
document.getElementById('createShopOwnerBtn').addEventListener('click', () => {
    document.getElementById('createAccountForm').reset();
    createModal.style.display = 'flex';
});

// 2. SUBMIT OWNER -> OPEN SHOP SETUP
document.getElementById('createAccountForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('passwordInput').value;
    const rePassword = document.getElementById('rePasswordInput').value;
    const errorMsg = document.getElementById('errorMsg');
    
    if (password !== rePassword) {
        errorMsg.textContent = "Passwords do not match!";
        errorMsg.style.display = 'block';
        return;
    }

    const payload = {
        UserEmail: document.getElementById('emailInput').value.trim(),
        UserPassword: password,
        OwnerName: document.getElementById('ownerNameInput').value,
        OwnerPhone: document.getElementById('ownerPhoneInput').value,
        OwnerAddress: document.getElementById('ownerAddressInput').value
    };

    try {
        const res = await fetch(`${API_BASE_URL}/users/owner`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();

        if (res.ok && result.success) {
            newlyCreatedOwnerID = result.userId; 
            createModal.style.display = 'none'; 
            
            // 🟢 OPEN STEP 2: Shop Setup
            document.getElementById('shopOwnerIdDisplay').textContent = newlyCreatedOwnerID;
            document.getElementById('createShopForm').reset();
            document.getElementById('shopImagePreview').src = 'https://placehold.co/100x100/e9ecef/ccc?text=Logo';
            document.getElementById('shopImageFile').value = ''; 
            createShopModal.style.display = 'flex';
            
            fetchUsers('Shop Owner'); 
        } else {
            errorMsg.textContent = result.message;
            errorMsg.style.display = 'block';
        }
    } catch (err) {
        errorMsg.textContent = "Network Error";
        errorMsg.style.display = 'block';
    }
});

// 🟢 Image Preview Helper
document.getElementById('shopImageFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => { document.getElementById('shopImagePreview').src = evt.target.result; };
        reader.readAsDataURL(file);
    }
});

// 3. SUBMIT SHOP DETAILS (Auto-Geocoding via Photon)
document.getElementById('createShopForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const shopError = document.getElementById('shopErrorMsg');
    const submitBtn = e.target.querySelector('.submit-btn');
    const addressInput = document.getElementById('shopAddressInput').value;
    const fileInput = document.getElementById('shopImageFile');

    submitBtn.textContent = "Processing...";
    submitBtn.disabled = true;
    shopError.style.display = 'none';

    let imageUrl = null;
    let lat = 0, lon = 0;

    try {
        // 🟢 A. Geocode Address (Photon API - CORS Friendly)
        try {
            const geoRes = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(addressInput)}&limit=1`);
            const geoData = await geoRes.json();
            if (geoData.features && geoData.features.length > 0) {
                 const coords = geoData.features[0].geometry.coordinates;
                 lon = coords[0];
                 lat = coords[1];
                 console.log("Geocoded:", lat, lon);
            } else {
                console.warn("Address not found on map, defaulting to 0,0");
            }
        } catch (geoErr) {
            console.error("Geocoding failed", geoErr);
        }

        // 🟢 B. Upload Image First (if selected)
        if (fileInput.files.length > 0) {
            const formData = new FormData();
            formData.append('image', fileInput.files[0]);
            const uploadRes = await fetch(`${API_BASE_URL}/shops/upload-image`, { method: 'POST', body: formData });
            const uploadData = await uploadRes.json();
            if (uploadData.success) imageUrl = uploadData.url;
        }

        // 🟢 C. Create Shop Payload
        const payload = {
            OwnerID: newlyCreatedOwnerID, 
            ShopName: document.getElementById('shopNameInput').value,
            ShopDescrp: document.getElementById('shopDescrpInput').value,
            ShopAddress: addressInput,
            ShopPhone: document.getElementById('shopPhoneInput').value,
            ShopOpeningHours: document.getElementById('shopHoursInput').value,
            ShopStatus: 'Available',
            ShopLatitude: lat, // From Photon
            ShopLongitude: lon, // From Photon
            ShopImage_url: imageUrl
        };

        const res = await fetch(`${API_BASE_URL}/shops/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();

        if (res.ok && result.success) {
            alert(`✅ Success! Shop Owner and Shop created.`);
            createShopModal.style.display = 'none';
        } else {
            shopError.textContent = result.message || "Failed to create shop.";
            shopError.style.display = 'block';
        }

    } catch (err) {
        shopError.textContent = err.message || "Network Error";
        shopError.style.display = 'block';
    } finally {
        submitBtn.textContent = "Complete Setup";
        submitBtn.disabled = false;
    }
});

// --- CLOSE MODALS ---
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        createModal.style.display = 'none';
        createShopModal.style.display = 'none';
        updateModal.style.display = 'none';
    });
});

// --- TABLE LISTENERS (UPDATE / STATUS) ---
searchInput.addEventListener('input', () => { currentPage = 1; applyFiltersAndPagination(); });
prevPageBtn.addEventListener('click', () => { currentPage--; applyFiltersAndPagination(); });
nextPageBtn.addEventListener('click', () => { currentPage++; applyFiltersAndPagination(); });

function attachRowListeners() {
    // Update Button Logic
    document.querySelectorAll('.update-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            currentUpdatingUserId = row.dataset.userId;
            currentUpdatingUserRole = row.dataset.userRole;
            
            document.getElementById('updateUserIdDisplay').textContent = row.dataset.userId;
            document.getElementById('updateEmailInput').value = row.dataset.userEmail;
            
            const isOwner = currentUpdatingUserRole === 'Shop Owner';
            document.getElementById('ownerDetailsFields').style.display = isOwner ? 'block' : 'none';
            
            if(isOwner) {
                const ownerData = allUsersData.find(u => u.UserID === row.dataset.userId);
                document.getElementById('updateOwnerNameInput').value = ownerData.OwnerName;
                document.getElementById('updateOwnerPhoneInput').value = ownerData.OwnerPhone;
                document.getElementById('updateOwnerAddressInput').value = ownerData.OwnerAddress;
            }
            updateModal.style.display = 'flex';
        });
    });
    
    // Update Form Submit
    updateUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const isOwner = currentUpdatingUserRole === 'Shop Owner';
        const payload = isOwner ? {
            UserEmail: document.getElementById('updateEmailInput').value,
            OwnerName: document.getElementById('updateOwnerNameInput').value,
            OwnerPhone: document.getElementById('updateOwnerPhoneInput').value,
            OwnerAddress: document.getElementById('updateOwnerAddressInput').value
        } : {
            UserEmail: document.getElementById('updateEmailInput').value,
            UserRole: currentUpdatingUserRole
        };

        const endpoint = isOwner ? `/users/owner/${currentUpdatingUserId}` : `/users/${currentUpdatingUserId}`;
        try {
            const res = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if(res.ok) {
                alert("Update successful");
                updateModal.style.display = 'none';
                fetchUsers(currentRole);
            } else {
                document.getElementById('updateErrorMsg').textContent = result.message;
            }
        } catch(err) { alert("Update failed"); }
    });

    // Status Toggle Logic (Fixed)
    document.querySelectorAll('.status-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const btn = e.target.closest('.status-btn'); // Ensure getting button
            const row = btn.closest('tr');
            const userId = row.dataset.userId;
            const rawAction = btn.getAttribute('data-action');
            const action = parseInt(rawAction, 10);
            
            if (isNaN(action)) {
                alert(`Error: Invalid status. (Value: ${rawAction})`);
                return;
            }

            const actionText = action === 1 ? 'Reactivate' : 'Deactivate';
            
            if (confirm(`Are you sure you want to ${actionText} user ${userId}?`)) {
                try {
                    const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ IsActive: action })
                    });
                    const result = await response.json();
                    if (response.ok && result.success) {
                        window.alert(result.message);
                        await fetchUsers(currentRole); 
                    } else {
                        window.alert(`Error: ${result.message}`);
                    }
                } catch (error) {
                    window.alert(`Network error: Failed to ${actionText} user.`);
                }
            }
        });
    });
}

let currentUpdatingUserId = null;
let currentUpdatingUserRole = null;

</script>
</body>
</html>