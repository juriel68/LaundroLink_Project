<div class="manage-users-container">
  <h2 class="page-title">Manage Users</h2>
  <p class="subtitle">User details and verification</p>

  <!-- Card Selection -->
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

  <!-- Table Section -->
  <div class="table-container" id="userTableContainer">
    <button class="back-btn" id="backBtn" style="display:none;">← Back</button>
    <h3 id="tableTitle"></h3>
    <button id="createShopOwnerBtn" class="create-btn" style="display:none;">+ Create Shop Owner Account</button>

    <table class="styled-table">
      <thead>
        <tr>
          <th>UserID</th>
          <th>Email</th>
          <th>Role</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="users-table-body"></tbody>
    </table>
  </div>
</div>

<!-- Popup Modal -->
<div id="createAccountModal" class="modal">
  <div class="modal-content">
    <span class="close-modal">&times;</span>
    <h3>Create Shop Owner Account</h3>
    <form id="createAccountForm">
      <label>Email:</label>
      <input type="email" id="emailInput" required />

      <label>Password:</label>
      <input type="password" id="passwordInput" required minlength="6" />

      <label>Re-enter Password:</label>
      <input type="password" id="rePasswordInput" required minlength="6" />

      <p id="errorMsg" style="color:red; display:none;"></p>
      <button type="submit" class="submit-btn">Create Account</button>
    </form>
  </div>
</div>

<style>
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
  color: #fff;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.role-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 14px rgba(0,0,0,0.15);
}

.shop-owner { background: linear-gradient(90deg, #7b2ff7, #f107a3); }
.customer   { background: linear-gradient(90deg, #11998e, #38ef7d); }
.staff      { background: linear-gradient(90deg, #f7971e, #ffd200); }

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
  display: none;
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
  table-layout: fixed;
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
}

.create-btn:hover {
  background: #218838;
}

/* --- Modal Styling --- */
.modal {
  display: none;
  position: fixed;
  z-index: 999;
  left: 0; top: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.4);
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: #fff;
  padding: 25px 30px;
  border-radius: 10px;
  width: 350px;
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

.modal-content input {
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
import { API_BASE_URL } from '../api.js';

const roleCards = document.querySelectorAll('.role-card');
const tableContainer = document.getElementById('userTableContainer');
const tableBody = document.getElementById('users-table-body');
const tableTitle = document.getElementById('tableTitle');
const cardContainer = document.querySelector('.card-container');
const backBtn = document.getElementById('backBtn');
const createBtn = document.getElementById('createShopOwnerBtn');

// === Handle Card Clicks ===
roleCards.forEach(card => {
  card.addEventListener('click', async () => {
    const role = card.dataset.role;
    cardContainer.style.display = 'none';
    backBtn.style.display = 'inline-block';
    tableTitle.textContent = `${role}s`;
    tableContainer.style.display = 'block';
    createBtn.style.display = role === 'Shop Owner' ? 'inline-block' : 'none';
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
  tableBody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';

  try {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    const data = await response.json();

    // Normalize possible key formats from backend
    const users = (Array.isArray(data) ? data : data.data || data.users || []).map(u => ({
      UserID: u.UserID || u.user_id || u.id,
      UserEmail: u.UserEmail || u.user_email || u.email,
      UserPassword: u.UserPassword || u.user_password || '',
      UserRole: u.UserRole || u.user_role || u.role,
      DateCreated: u.DateCreated || u.date_created || ''
    }));

    // Filter by role (case-insensitive)
    const filteredUsers = users.filter(
      u => (u.UserRole || '').toLowerCase() === role.toLowerCase()
    );

    renderTable(filteredUsers, role);
  } catch (err) {
    console.error(err);
    tableBody.innerHTML = `<tr><td colspan="4">Error: ${err.message}</td></tr>`;
  }
}

// === Render Table ===
function renderTable(users, role) {
  if (!users || users.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="4">No ${role.toLowerCase()}s found.</td></tr>`;
    return;
  }

  tableBody.innerHTML = users.map(user => `
    <tr data-user-id="${user.UserID}">
      <td>${user.UserID}</td>
      <td>${user.UserEmail}</td>
      <td>
        <select class="role-select">
          <option value="Customer" ${user.UserRole === 'Customer' ? 'selected' : ''}>Customer</option>
          <option value="Staff" ${user.UserRole === 'Staff' ? 'selected' : ''}>Staff</option>
          <option value="Shop Owner" ${user.UserRole === 'Shop Owner' ? 'selected' : ''}>Shop Owner</option>
          <option value="Admin" ${user.UserRole === 'Admin' ? 'selected' : ''}>Admin</option>
        </select>
      </td>
      <td>
        <button class="update-btn">Update</button>
        <button class="delete-btn">Delete</button>
      </td>
    </tr>
  `).join('');

  attachEventListeners();
}

// === Event Handlers for Buttons ===
function attachEventListeners() {
  document.querySelectorAll('.update-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const row = e.target.closest('tr');
      const userId = row.dataset.userId;
      const newRole = row.querySelector('.role-select').value;

      if (confirm(`Change this user's role to ${newRole}?`)) {
        try {
          const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRole })
          });
          const result = await response.json();
          alert(result.message || 'User role updated.');
        } catch {
          alert('Error updating role.');
        }
      }
    });
  });

  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const userId = e.target.closest('tr').dataset.userId;
      if (confirm('Are you sure you want to permanently delete this user?')) {
        try {
          const response = await fetch(`${API_BASE_URL}/users/${userId}`, { method: 'DELETE' });
          const result = await response.json();
          alert(result.message || 'User deleted.');
          e.target.closest('tr').remove();
        } catch {
          alert('Error deleting user.');
        }
      }
    });
  });
}

/* === Modal Logic === */
const modal = document.getElementById('createAccountModal');
const closeModal = modal.querySelector('.close-modal');
const createForm = document.getElementById('createAccountForm');
const errorMsg = document.getElementById('errorMsg');

createBtn.addEventListener('click', () => {
  modal.style.display = 'flex';
  errorMsg.style.display = 'none';
  createForm.reset();
});

closeModal.addEventListener('click', () => {
  modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === modal) modal.style.display = 'none';
});

createForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value;
  const rePassword = document.getElementById('rePasswordInput').value;

  if (password !== rePassword) {
    errorMsg.textContent = "Passwords do not match!";
    errorMsg.style.display = 'block';
    return;
  }

  errorMsg.style.display = 'none';
  modal.style.display = 'none';
  alert(`✅ Shop Owner Account Created Successfully!\n\nEmail: ${email}\nPassword: (hidden)`);
});
</script>

