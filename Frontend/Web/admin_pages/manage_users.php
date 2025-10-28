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
        <button id="backBtn" class="back-btn" style="display:none;">← Back to Roles</button>
        <button id="createShopOwnerBtn" class="create-btn" style="display:none;">+ Create Shop Owner</button>
        
        <h3 id="tableTitle"></h3> <table class="styled-table">
            <thead>
                <tr>
                    <th>UserID</th>
                    <th>Email</th>
                    <th class="owner-col">Owner Name</th>
                    <th class="owner-col">Phone</th>
                    <th class="owner-col">Address</th>
                    <th>Date Created</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="users-table-body"></tbody>
        </table>
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

<style>
/* ... (existing CSS for .manage-users-container, .page-title, .card-container, etc.) ... */
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

.update-btn, .delete-btn {
    border: none;
    border-radius: 6px;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 13px;
    color: white;
}

.update-btn { background: #0077b6; }
.update-btn:hover { background: #005f87; }

.delete-btn { background: #e63946; }
.delete-btn:hover { background: #c1121f; }

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

/* --- MODAL STYLES (CRITICAL FIX APPLIED HERE) --- */
.modal {
    display: none; /* FIX: MUST BE NONE BY DEFAULT (JS sets to flex when opening) */
    position: fixed;
    z-index: 1000; 
    left: 0; top: 0;
    width: 100%; height: 100%;
    background: rgba(0,0,0,0.6); 
    
    /* These flex properties are now correctly applied when JS sets display: flex */
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
</style>

<script type="module">
// NOTE: Make sure your '../api.js' file exports the API_BASE_URL constant
import { API_BASE_URL } from '../api.js'; 

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

// ===================================================================
// MAIN NAVIGATION & TABLE RENDERING
// ===================================================================

// === Handle Card Clicks ===
roleCards.forEach(card => {
  card.addEventListener('click', async () => {
    const role = card.dataset.role;
    
    // 1. Toggle visibility
    cardContainer.style.display = 'none';
    backBtn.style.display = 'inline-block';
    tableContainer.style.display = 'block';
    
    // 2. Set title and create button
    tableTitle.textContent = `${role}s`;
    const isOwner = role === 'Shop Owner';
    createBtn.style.display = isOwner ? 'inline-block' : 'none';
    
    // 3. Toggle owner columns visibility
    tableHeaders.forEach(header => {
        if (header.classList.contains('owner-col')) {
            header.style.display = isOwner ? '' : 'none'; 
        }
    });

    await fetchUsers(role);
  });
});

// === Back Button ===
backBtn.addEventListener('click', () => {
  cardContainer.style.display = 'flex';
  tableContainer.style.display = 'none';
  backBtn.style.display = 'none';
  createBtn.style.display = 'none';
});

// === Fetch Users from API ===
async function fetchUsers(role) {
  const isOwner = role === 'Shop Owner';
  const colspan = isOwner ? 7 : 4; 
  
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
      
      OwnerName: u.OwnerName || u.owner_name || 'N/A',
      OwnerPhone: u.OwnerPhone || u.owner_phone || 'N/A',
      OwnerAddress: u.OwnerAddress || u.owner_address || 'N/A'
    }));

    let filteredUsers = users;
    
    if (!isOwner) {
        filteredUsers = users.filter(
          u => (u.UserRole || '').toLowerCase() === role.toLowerCase()
        );
    }

    renderTable(filteredUsers, role);
  } catch (err) {
    console.error(err);
    tableBody.innerHTML = `<tr><td colspan="${colspan}">Error: ${err.message}</td></tr>`;
  }
}

// === Render Table ===
function renderTable(users, role) {
  const isOwner = role === 'Shop Owner';
  const colspan = isOwner ? 7 : 4;

  if (!users || users.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="${colspan}">No ${role.toLowerCase()}s found.</td></tr>`;
    return;
  }

  tableBody.innerHTML = users.map(user => `
    <tr data-user-id="${user.UserID}" 
        data-user-email="${user.UserEmail}" 
        data-user-role="${user.UserRole}">
      <td>${user.UserID}</td>
      <td>${user.UserEmail}</td>
      
      ${isOwner ? `
        <td>${user.OwnerName}</td>
        <td>${user.OwnerPhone}</td>
        <td>${user.OwnerAddress}</td>
      ` : ''}

      <td>${formatDate(user.DateCreated)}</td>
      <td>
        <button class="update-btn">Update</button>
        <button class="delete-btn">Delete</button>
      </td>
    </tr>
  `).join('');

  attachEventListeners();
}

// ===================================================================
// BUTTON EVENT LISTENERS (UPDATE AND DELETE)
// ===================================================================

function attachEventListeners() {
    // Update button click handler
    document.querySelectorAll('.update-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            
            // Get data from the row attributes
            const userId = row.dataset.userId;
            const email = row.dataset.userEmail;
            const role = row.dataset.userRole; // Get the user's role
            
            // Store global variables
            currentUpdatingUserId = userId; 
            currentUpdatingUserRole = role;

            // --- Modal Setup ---
            
            updateUserIdDisplay.textContent = userId;
            updateEmailInput.value = email;
            updateErrorMsg.style.display = 'none';

            // 1. Determine Visibility
            const isOwner = role === 'Shop Owner';

            // 2. Adjust Modal Title
            updateModalTitle.textContent = isOwner ? 
                'Update Shop Owner Details' : 
                `Update ${role} Details`;

            // 3. Toggle Owner Fields
            ownerDetailsFields.style.display = isOwner ? 'block' : 'none';

            if (isOwner) {
                // If Shop Owner, retrieve and populate the detailed fields
                const cells = row.querySelectorAll('td');
                // Indices: [0]UserID, [1]Email, [2]OwnerName, [3]Phone, [4]Address, [5]DateCreated, [6]Actions
                const ownerName = cells[2] ? cells[2].textContent : '';
                const ownerPhone = cells[3] ? cells[3].textContent : '';
                const ownerAddress = cells[4] ? cells[4].textContent : '';

                updateOwnerNameInput.value = ownerName;
                // Clear 'N/A' placeholder for input fields
                updateOwnerPhoneInput.value = ownerPhone === 'N/A' ? '' : ownerPhone; 
                updateOwnerAddressInput.value = ownerAddress === 'N/A' ? '' : ownerAddress;
            } else {
                // If Customer/Staff, clear fields (they should be hidden anyway)
                updateOwnerNameInput.value = '';
                updateOwnerPhoneInput.value = '';
                updateOwnerAddressInput.value = '';
            }
            
            // Display the modal
            updateModal.style.display = 'flex';
        });
    });

    // Delete button click handler
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const userId = e.target.closest('tr').dataset.userId;
            if (confirm('Are you sure you want to permanently delete this user?')) {
                try {
                    const response = await fetch(`${API_BASE_URL}/users/${userId}`, { method: 'DELETE' });
                    const result = await response.json();
                    alert(result.message || 'User deleted.');
                    
                    const currentRole = document.querySelector('#tableTitle').textContent.replace(/s$/, '').trim();
                    await fetchUsers(currentRole); 
                } catch {
                    alert('Error deleting user.');
                }
            }
        });
    });
}

// ===================================================================
// MODAL LOGIC (COMMON AND UPDATE)
// ===================================================================

// Close button for Update Modal
updateCloseBtn.addEventListener('click', () => {
    updateModal.style.display = 'none';
});

// Update Form Submission
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
        // NOTE: We assume you have a generic user update endpoint, e.g., /users/:id
        apiUrl = `${API_BASE_URL}/users/${currentUpdatingUserId}`; 
        payload = {
            UserEmail: updatedEmail,
            // Pass the role to the backend to help with validation/logic, 
            // even if the user can't change it here.
            UserRole: currentUpdatingUserRole 
        };
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
            alert(result.message || `✅ ${successMsg}`);
            updateModal.style.display = 'none';
            
            // Refresh the current table view
            await fetchUsers(currentUpdatingUserRole);
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
          alert(`✅ Shop Owner Account Created Successfully!\nUserID: ${result.userId}`);
          createModal.style.display = 'none';
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