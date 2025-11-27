<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Manage Shop - LaundroLink</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        /* --- BASE STYLES --- */
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            background-color: #f8f9fa; 
            overflow-x: hidden; 
        }

        .title-box { 
            background: white; 
            border-radius: 10px; 
            max-width: 1100px; 
            margin: 30px auto 20px; 
            padding: 25px 35px; 
            box-shadow: 0 4px 10px rgba(0,0,0,0.1); 
            position: relative; 
        }
        
        h1 { color: #004aad; margin-bottom: 8px; margin-top: 0; }
        p { color: #555; margin: 0; }
        
        /* LAYOUT GRID */
        .shop-details-container { 
            display: grid; 
            grid-template-columns: 2fr 1fr; 
            gap: 30px; 
            max-width: 1100px; 
            margin: 0 auto 40px; 
            align-items: flex-start; 
        }
        
        /* CARDS & SECTIONS */
        .shop-card, .staff-section, .rating-summary { 
            background: white; 
            border-radius: 15px; 
            padding: 30px; 
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08); 
            margin-bottom: 30px; 
        }
        
        /* SHOP HEADER */
        .shop-header { text-align: center; margin-bottom: 25px; }
        .shop-image-display { 
            width: 150px; height: 150px; 
            border-radius: 50%; 
            object-fit: cover; 
            margin: 0 auto 20px; 
            border: 4px solid #f0f4f8; 
            box-shadow: 0 0 10px rgba(0,0,0,0.1); 
            overflow: hidden;
        }
        .image-placeholder { 
            width: 100%; height: 100%; 
            background: #e9ecef; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            color: #ccc; 
        }
        .shop-name { font-weight: 700; font-size: 28px; color: #004aad; margin-bottom: 8px; margin-top: 0; }
        .shop-descrp { color: #555; font-size: 15px; line-height: 1.6; font-style: italic; }
        
        /* DETAILS BOX */
        .details-box { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0; }
        .shop-detail { display: flex; align-items: center; gap: 12px; font-size: 15px; color: #333; margin-bottom: 12px; }
        .shop-detail .icon { color: #004aad; width: 20px; text-align: center; }
        
        /* STATUS & ACTION BUTTONS */
        .status-container { text-align: center; margin-bottom: 25px; }
        .shop-status { display: inline-block; font-size: 14px; font-weight: 600; padding: 6px 16px; border-radius: 20px; }
        .status-available { color: #1c7430; background: #e8f7ed; }
        .status-closed { color: #a72825; background: #f7e8e8; }
        
        .btn-edit { 
            background-color: #004aad; color: white; border: none; border-radius: 8px; 
            padding: 12px 25px; cursor: pointer; font-size: 16px; font-weight: 600; 
            width: 100%; margin-top: 10px; transition: background 0.2s;
        }
        .btn-edit:hover { background-color: #003c8a; }
        
        /* ADMIN BACK BUTTON */
        .btn-admin-back { 
            position: absolute; top: 25px; right: 35px; 
            background-color: #6c757d; color: white; 
            padding: 8px 15px; text-decoration: none; 
            border-radius: 5px; font-size: 14px; display: none; 
        }
        .btn-admin-back:hover { background-color: #5a6268; }

        /* STAFF SECTION */
        .staff-header { 
            display: flex; justify-content: space-between; align-items: center; 
            margin-bottom: 20px; border-bottom: 2px solid #f0f4f8; padding-bottom: 10px; 
        }
        .staff-header h2 { margin: 0; font-size: 22px; color: #004aad; }
        
        .btn-add-staff { 
            background-color: #28a745; color: white; border: none; 
            padding: 8px 15px; border-radius: 6px; cursor: pointer; 
            font-weight: 600; font-size: 14px; display: inline-flex; 
            align-items: center; gap: 5px; 
        }
        .btn-add-staff:hover { background-color: #218838; }
        
        .staff-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .staff-table th, .staff-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; font-size: 14px; }
        .staff-table th { background-color: #f8f9fa; color: #444; font-weight: 600; }
        .staff-role-badge { padding: 4px 8px; border-radius: 4px; background: #e3f2fd; color: #0d47a1; font-size: 12px; font-weight: 600; }

        /* RATINGS SECTION */
        .reviews-column h2 { font-size: 22px; color: #004aad; margin-bottom: 20px; margin-top: 0; }
        .rating-main { text-align: center; margin-bottom: 20px; }
        .rating-score { font-size: 3rem; font-weight: 700; color: #333; }
        .rating-stars .fas.fa-star { color: #ffc107; }
        .rating-stars .far.fa-star { color: #e0e0e0; }
        .rating-count { font-size: 14px; color: #555; margin-top: 10px; }
        .rating-row { display: flex; align-items: center; gap: 8px; margin: 6px 0; font-size: 14px; color: #444; width: 100%; }
        .rating-row .bar { flex-grow: 1; height: 8px; background: #e9ecef; border-radius: 5px; overflow: hidden; }
        .rating-row .bar-fill { height: 100%; background: #ffc107; border-radius: 5px; }

        /* === MODAL & POPUP STYLES === */
        .modal, .popup { 
            display: none; 
            position: fixed; z-index: 9999; 
            left: 0; top: 0; 
            width: 100%; height: 100%; 
            background-color: rgba(0,0,0,0.6); 
            justify-content: center; align-items: center; 
            padding: 20px; 
            box-sizing: border-box;
        }

        .popup-content, .modal-content { 
            background-color: #fff; 
            padding: 30px; 
            border-radius: 12px; 
            width: 500px; 
            max-width: 100%; 
            box-shadow: 0 6px 16px rgba(0,0,0,0.25); 
            max-height: 90vh; 
            overflow-y: auto; 
            position: relative;
        }

        .popup-content h2, .modal-content h2 { 
            color: #004aad; margin-top: 0; margin-bottom: 20px; text-align: center; 
        }

        .popup-content label, .modal-content label { 
            font-weight: 600; font-size: 14px; 
            display: block; margin-top: 15px; margin-bottom: 5px; color: #333; 
        }

        .popup-content input:not([type="file"]), 
        .popup-content textarea, 
        .popup-content select,
        .modal-content input, 
        .modal-content select { 
            width: 100%; padding: 10px; 
            border-radius: 6px; border: 1px solid #ccc; 
            box-sizing: border-box; font-size: 14px; 
        }

        /* 🟢 FIXED: CSS for Image Upload Area */
        .image-upload-area { 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            margin-top: 10px; 
            padding: 15px; 
            border: 2px dashed #ddd; 
            border-radius: 8px; 
        }
        
        /* 🟢 FIXED: ID Selector matching HTML */
        #shopImagePreview { 
            width: 120px; height: 120px; /* Controlled size */
            border-radius: 50%; 
            margin-bottom: 10px; 
            object-fit: cover; 
            border: 2px solid #eee; 
            display: block; /* Ensure it respects dimensions */
        }
        
        .popup-buttons { text-align: right; margin-top: 25px; display: flex; justify-content: flex-end; gap: 10px; }
        .btn-cancel { background-color: #ccc; color: #333; padding: 10px 18px; border-radius: 6px; border: none; cursor: pointer; font-weight: 600; }
        .btn-save { background-color: #004aad; color: white; padding: 10px 18px; border-radius: 6px; border: none; cursor: pointer; font-weight: 600; }
        .btn-save:hover { background-color: #003c8a; }
        .btn-pinpoint { background-color: #17a2b8; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; margin-top: 5px; font-size: 13px; }

        @media (max-width: 768px) {
            .shop-details-container { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>

    <div class="title-box">
        <a href="#" onclick="history.back()" class="btn-admin-back" id="adminBackBtn"><i class="fas fa-arrow-left"></i> Back to List</a>
        <h1>My Shop Details</h1>
        <p>View and manage shop information, staff, and customer feedback.</p>
    </div>

    <div id="shop-main-content">
        <p style="text-align:center; margin-top: 50px; color:#666;">Checking shop status...</p>
    </div>

    <div class="shop-details-container" id="shop-details-view" style="display:none;">
        <div class="details-column">
            <div class="shop-card">
                <div class="shop-header">
                    <div class="shop-image-display" id="shop-image-display">
                        <div class="image-placeholder"><i class="fas fa-camera" style="font-size: 30px;"></i></div>
                    </div>
                    <h2 class="shop-name" id="shop-name-display"></h2>
                    <p class="shop-descrp" id="shop-descrp-display"></p>
                </div>
                <div class="details-box">
                    <div class="shop-detail"><i class="fas fa-map-marker-alt icon"></i><span id="shop-address-display"></span></div>
                    <div class="shop-detail"><i class="fas fa-phone icon"></i><span id="shop-phone-display"></span></div>
                    <div class="shop-detail"><i class="fas fa-clock icon"></i><span id="shop-hours-display"></span></div>
                </div>
                <div class="status-container">
                    <span class="shop-status" id="shop-status-display"></span>
                </div>
                
                <button class="btn-edit" id="edit-details-btn">Edit Details</button>
                
                <button class="btn-edit" id="configure-shop-btn" style="background-color: #1a76d2;">
                    Configure Services & Pricing
                </button>
            </div>

            <div class="staff-section">
                <div class="staff-header">
                    <h2><i class="fas fa-users"></i> Staff Team</h2>
                    <button class="btn-add-staff" id="addStaffBtn"><i class="fas fa-plus"></i> Add New Staff</button>
                </div>
                <table class="staff-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Phone</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="staffTableBody">
                        <tr><td colspan="4" style="text-align:center; color:#888;">Loading staff...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="reviews-column">
            <h2>Ratings</h2>
            <div class="rating-summary">
                <div class="rating-main">
                    <div class="rating-score" id="avg-rating-score">0.0</div>
                    <div class="rating-stars" id="rating-stars"></div>
                    <div class="rating-count" id="rating-count">Based on 0 reviews</div>
                </div>
                <div class="rating-breakdown" id="rating-breakdown"></div>
            </div>
        </div>
    </div>
    
    <div id="config-area" style="max-width: 1100px; margin: 0 auto 40px; display: none;">
        <iframe id="config-iframe" src="" style="width: 100%; min-height: 2500px; border: none; background: transparent;" scrolling="no" frameborder="0"></iframe>
    </div>

    <div id="managePopup" class="popup">
        <div class="popup-content">
            <h2>Manage Shop Details</h2>
            <form id="manageForm">
                <input type="hidden" id="shopID">
                <input type="hidden" id="shopImageURL">
                
                <div id="ownerIdContainer" style="display: none;">
                    <label style="color:#d9534f;">Owner ID (Admin Only)</label>
                    <input type="text" id="newOwnerID" placeholder="e.g. O1, O2">
                </div>

                <label>Shop Logo</label>
                <div class="image-upload-area">
                    <img id="shopImagePreview" src="https://placehold.co/100x100/e9ecef/ccc?text=Logo" alt="Shop Preview">
                    <input type="file" id="shopImageFile" accept="image/*" style="margin-top:10px;">
                </div>

                <label>Shop Name</label> 
                <input type="text" id="shopName" required>
                
                <label>Description</label> 
                <textarea id="shopDescrp" rows="3" required></textarea>
                
                <label>Address</label>
                <input type="hidden" id="shopLatitude">
                <input type="hidden" id="shopLongitude">
                <input type="text" id="shopAddress" required>
                <button type="button" id="pinpointBtn" class="btn-pinpoint"><i class="fas fa-map-marker-alt"></i> Pinpoint Location</button>
                <span id="locationStatus" style="font-size:12px; color:#666; margin-left:10px;"></span>
                
                <label>Phone Number</label> 
                <input type="text" id="shopPhone" required>
                
                <label>Opening Hours</label> 
                <input type="text" id="shopHours" required>
                
                <label>Status</label>
                <select id="shopStatus">
                    <option value='Available'>Available</option>
                    <option value='Closed'>Closed</option>
                </select>
                
                <div class='popup-buttons'>
                    <button type='button' class='btn-cancel' id="cancelBtn">Cancel</button>
                    <button type='submit' class='btn-save'>Save Changes</button>
                </div>
            </form>
        </div>
    </div>

    <div id="addStaffModal" class="modal">
        <div class="modal-content">
            <h2>Add New Staff Member</h2>
            <form id="addStaffForm">
                <label>Full Name</label>
                <input type="text" id="staffNameInput" required placeholder="e.g. Juan Dela Cruz">

                <label>Role</label>
                <select id="staffRoleInput" required>
                    <option value="Cashier">Cashier</option>
                    <option value="Washer">Washer</option>
                    <option value="Delivery">Delivery Rider</option>
                    <option value="Manager">Manager</option>
                </select>

                <label>Age</label>
                <input type="number" id="staffAgeInput" required min="18">

                <label>Phone Number</label>
                <input type="text" id="staffPhoneInput" required placeholder="0912 345 6789">

                <label>Address</label>
                <input type="text" id="staffAddressInput" required>

                <label>Monthly Salary (₱)</label>
                <input type="number" id="staffSalaryInput" required step="0.01">

                <div class='popup-buttons'>
                    <button type='button' class='btn-cancel' id="closeStaffModal">Cancel</button>
                    <button type='submit' class='btn-save'>Add Staff Member</button>
                </div>
            </form>
        </div>
    </div>

    <script type="module">
        import { API_BASE_URL } from '../api.js';

        // --- 1. CONTEXT SETUP ---
        const urlParams = new URLSearchParams(window.location.search);
        const adminShopId = urlParams.get('shop_id');
        const adminMode = urlParams.get('admin_mode') === 'true';
        const action = urlParams.get('action');

        const loggedInUser = JSON.parse(localStorage.getItem('laundroUser'));
        const SHOP_ID = adminShopId || loggedInUser?.ShopID;

        if (adminMode) document.getElementById('adminBackBtn').style.display = 'inline-block';

        // --- 2. DOM ELEMENTS ---
        const managePopup = document.getElementById('managePopup');
        const addStaffModal = document.getElementById('addStaffModal');
        const manageForm = document.getElementById('manageForm');
        
        const shopMainContent = document.getElementById('shop-main-content');
        const shopDetailsView = document.getElementById('shop-details-view');
        const configArea = document.getElementById('config-area');
        const staffTableBody = document.getElementById('staffTableBody');
        
        // Shop Elements
        const shopNameEl = document.getElementById('shop-name-display');
        const shopDescrpEl = document.getElementById('shop-descrp-display');
        const shopAddressEl = document.getElementById('shop-address-display');
        const shopPhoneEl = document.getElementById('shop-phone-display');
        const shopHoursEl = document.getElementById('shop-hours-display');
        const shopStatusEl = document.getElementById('shop-status-display');
        const shopImageDisplay = document.getElementById('shop-image-display');
        
        // Inputs
        const shopImageURLInput = document.getElementById('shopImageURL');
        const shopImageFile = document.getElementById('shopImageFile');
        const imagePreview = document.getElementById('shopImagePreview');
        const shopLatitudeInput = document.getElementById('shopLatitude');
        const shopLongitudeInput = document.getElementById('shopLongitude');
        const shopAddressInput = document.getElementById('shopAddress');
        const newOwnerIdInput = document.getElementById('newOwnerID');
        const ownerIdContainer = document.getElementById('ownerIdContainer');

        let shopCoordinates = {}; 

        // --- 3. UI HELPERS ---
        const showMainDetailsView = () => {
            configArea.style.display = 'none';
            shopDetailsView.style.display = 'grid';
            document.querySelector('.title-box h1').textContent = 'My Shop Details';
            document.querySelector('.title-box p').textContent = 'View and manage shop information, staff, and feedback.';
        };
        window.showMainDetailsView = showMainDetailsView;

        // --- 4. FETCH DATA ---
        async function fetchShopDetails() {
            if (!SHOP_ID && action !== 'create') {
                shopMainContent.innerHTML = `<div class="title-box"><p style="text-align:center; color:#666;">No Shop Linked.</p></div>`;
                return;
            }
            
            if (action === 'create' && adminMode) {
                openManagePopupForCreate();
                return;
            }

            shopMainContent.innerHTML = '';
            shopDetailsView.style.display = 'grid';

            try {
                const response = await fetch(`${API_BASE_URL}/shops/${SHOP_ID}/full-details-owner`);
                const data = await response.json();
                
                updateShopInfo(data.details);
                updateRatingSummary(data.rating);
                shopCoordinates = { lat: data.details.ShopLatitude, lon: data.details.ShopLongitude };
                
                fetchStaffList();

            } catch (error) {
                shopDetailsView.style.display = 'none';
                shopMainContent.innerHTML = `<p style="text-align:center; color:red; margin-top:50px;">Error: ${error.message}</p>`;
            }
        }

        const updateShopInfo = (details) => {
            document.getElementById('shop-name-display').textContent = details.ShopName;
            document.getElementById('shop-descrp-display').textContent = details.ShopDescrp;
            document.getElementById('shop-address-display').textContent = details.ShopAddress;
            document.getElementById('shop-phone-display').textContent = details.ShopPhone;
            document.getElementById('shop-hours-display').textContent = details.ShopOpeningHours;
            document.getElementById('shop-status-display').textContent = details.ShopStatus;
            document.getElementById('shop-status-display').className = `shop-status status-${details.ShopStatus.toLowerCase()}`;
            
            if (details.ShopImage_url) {
                shopImageDisplay.innerHTML = `<img src="${details.ShopImage_url}" alt="Shop Logo" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            } else {
                shopImageDisplay.innerHTML = `<div class="image-placeholder"><i class="fas fa-camera" style="font-size: 30px;"></i></div>`;
            }
            shopImageURLInput.value = details.ShopImage_url || '';
        };

        const updateRatingSummary = (rating) => {
            const avg = parseFloat(rating.averageRating || 0);
            document.getElementById('avg-rating-score').textContent = avg.toFixed(1);
            document.getElementById('rating-count').textContent = `Based on ${rating.ratingCount || 0} reviews`;
            
            const ratingStarsEl = document.getElementById('rating-stars');
            let starsHTML = '';
            for (let i = 0; i < Math.floor(avg); i++) starsHTML += '<i class="fas fa-star"></i>';
            if (avg % 1 >= 0.5) starsHTML += '<i class="fas fa-star-half-alt"></i>';
            ratingStarsEl.innerHTML = starsHTML || '<span class="no-reviews" style="color:#999; font-style:italic;">No ratings</span>';
            
            const breakdownContainer = document.getElementById('rating-breakdown');
            breakdownContainer.innerHTML = '';
            const count = parseInt(rating.ratingCount || 0);
            for (let i = 5; i >= 1; i--) {
                 const starCount = rating.breakdown[i] || 0;
                 const percent = count > 0 ? (starCount / count) * 100 : 0;
                 breakdownContainer.innerHTML += `
                    <div class="rating-row">
                        <span style="width:30px; text-align:right; font-size:13px;">${i}★</span>
                        <div class="bar"><div class="bar-fill" style="width:${percent}%"></div></div>
                        <span style="font-size:13px; color:#666;">${starCount}</span>
                    </div>`;
            }
        };

        // --- 5. STAFF LOGIC ---
        async function fetchStaffList() {
            try {
                const response = await fetch(`${API_BASE_URL}/users/staff/${SHOP_ID}`);
                const data = await response.json();
                const staff = data.staff || [];

                if (staff.length === 0) {
                    staffTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:15px; color:#888;">No staff members added yet.</td></tr>`;
                    return;
                }

                staffTableBody.innerHTML = staff.map(s => `
                    <tr>
                        <td style="font-weight:600; color:#333;">${s.StaffName}</td>
                        <td><span class="staff-role-badge">${s.StaffRole}</span></td>
                        <td>${s.StaffCellNo}</td>
                        <td><span style="color:${s.IsActive ? 'green' : 'red'}; font-size:12px; font-weight:600;">${s.IsActive ? 'Active' : 'Inactive'}</span></td>
                    </tr>
                `).join('');
            } catch (error) {
                staffTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">Error loading staff list.</td></tr>`;
            }
        }

        // Open/Close Staff Modal
        document.getElementById('addStaffBtn').addEventListener('click', () => {
            document.getElementById('addStaffForm').reset();
            addStaffModal.style.display = 'flex';
        });
        document.getElementById('closeStaffModal').addEventListener('click', () => {
            addStaffModal.style.display = 'none';
        });

        // Submit New Staff
        document.getElementById('addStaffForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = e.target.querySelector('.btn-save');
            submitBtn.textContent = "Adding...";
            submitBtn.disabled = true;

            // 🟢 FIX: Correct payload matching backend users.js requirements
            const payload = {
                ShopID: SHOP_ID,
                StaffName: document.getElementById('staffNameInput').value,
                StaffRole: document.getElementById('staffRoleInput').value,
                StaffAge: parseInt(document.getElementById('staffAgeInput').value), // Force Int
                StaffAddress: document.getElementById('staffAddressInput').value,
                StaffCellNo: document.getElementById('staffPhoneInput').value,
                StaffSalary: parseFloat(document.getElementById('staffSalaryInput').value) // Force Float
            };

            try {
                const res = await fetch(`${API_BASE_URL}/users/staff`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await res.json();

                if (res.ok) {
                    alert(`✅ Staff Added! \nLogin Email: ${result.generatedEmail}\nDefault Password: ${result.generatedEmail}`);
                    addStaffModal.style.display = 'none';
                    fetchStaffList(); 
                } else {
                    alert(`Error: ${result.error || result.message}`);
                }
            } catch (err) {
                alert("Network Error: Failed to add staff.");
            } finally {
                submitBtn.textContent = "Add Staff Member";
                submitBtn.disabled = false;
            }
        });

        // --- 6. EDIT SHOP LOGIC ---
        function openManagePopupForCreate() {
            document.getElementById('shopID').value = ''; 
            document.getElementById('shopName').value = '';
            document.getElementById('shopDescrp').value = '';
            document.getElementById('shopAddress').value = '';
            document.getElementById('shopPhone').value = '';
            document.getElementById('shopHours').value = '';
            document.getElementById('shopStatus').value = 'Available';
            
            shopLatitudeInput.value = '';
            shopLongitudeInput.value = '';
            shopImageURLInput.value = ''; 
            imagePreview.src = 'https://placehold.co/100x100/e9ecef/ccc?text=Logo';
            shopImageFile.value = ''; 

            if (adminMode) {
                ownerIdContainer.style.display = 'block';
                newOwnerIdInput.required = true;
            }
            managePopup.style.display = 'flex';
        }

        const uploadImageToBackend = async (file) => {
            const formData = new FormData();
            formData.append('image', file);
            try {
                const response = await fetch(`${API_BASE_URL}/shops/upload-image`, { method: 'POST', body: formData });
                const result = await response.json();
                return result.success ? result.url : shopImageURLInput.value;
            } catch (e) {
                alert("Image upload failed.");
                return shopImageURLInput.value;
            }
        };

        shopImageFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => { imagePreview.src = evt.target.result; };
                reader.readAsDataURL(file);
            }
        });

        // 🟢 FIXED: Pinpoint Logic with Photon API (No CORS issues)
        document.getElementById('pinpointBtn').addEventListener('click', () => {
             const locStatus = document.getElementById('locationStatus');
             locStatus.textContent = "Locating...";
             if (!navigator.geolocation) return alert("No Geolocation support");
             
             navigator.geolocation.getCurrentPosition(async (pos) => {
                 const lat = pos.coords.latitude;
                 const lon = pos.coords.longitude;
                 shopLatitudeInput.value = lat;
                 shopLongitudeInput.value = lon;
                 
                 try {
                     const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`);
                     const data = await res.json();
                     if (data.features && data.features.length > 0) {
                        const p = data.features[0].properties;
                        // Build address string
                        const addr = [p.name, p.street, p.district, p.city, p.state, p.country].filter(Boolean).join(', ');
                        document.getElementById('shopAddress').value = addr;
                        locStatus.textContent = "✅ Address Found!";
                        locStatus.style.color = "green";
                     } else {
                        locStatus.textContent = "Coords set (No address found)";
                     }
                 } catch(e) {
                     locStatus.textContent = "Coords set (Map Error)";
                 }
             });
        });

        document.getElementById('edit-details-btn').addEventListener('click', () => {
             document.getElementById('shopID').value = SHOP_ID;
             document.getElementById('shopName').value = document.getElementById('shop-name-display').textContent;
             document.getElementById('shopDescrp').value = document.getElementById('shop-descrp-display').textContent;
             document.getElementById('shopAddress').value = document.getElementById('shop-address-display').textContent;
             document.getElementById('shopPhone').value = document.getElementById('shop-phone-display').textContent;
             document.getElementById('shopHours').value = document.getElementById('shop-hours-display').textContent;
             document.getElementById('shopStatus').value = document.getElementById('shop-status-display').textContent;
             
             shopLatitudeInput.value = shopCoordinates.lat || '';
             shopLongitudeInput.value = shopCoordinates.lon || '';
             
             const currentImg = document.getElementById('shopImageURL').value;
             imagePreview.src = currentImg || 'https://placehold.co/100x100/e9ecef/ccc?text=Logo';
             
             managePopup.style.display = 'flex';
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
             if(action === 'create') window.history.back(); 
             else managePopup.style.display = 'none';
        });

        manageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const shopId = document.getElementById('shopID').value;
            const isCreating = !shopId; 
            
            const saveBtn = document.querySelector('#managePopup .btn-save');
            saveBtn.textContent = 'Processing...';
            saveBtn.disabled = true;

            try {
                const lat = shopLatitudeInput.value;
                const lon = shopLongitudeInput.value;
                if (!lat || !lon) { throw new Error("Please use 'Pinpoint Location' to set coordinates."); }

                let finalImageUrl = shopImageURLInput.value;
                if (shopImageFile.files.length > 0) {
                    finalImageUrl = await uploadImageToBackend(shopImageFile.files[0]);
                }

                const payload = {
                    ShopName: document.getElementById('shopName').value,
                    ShopDescrp: document.getElementById('shopDescrp').value,
                    ShopAddress: document.getElementById('shopAddress').value,
                    ShopPhone: document.getElementById('shopPhone').value,
                    ShopOpeningHours: document.getElementById('shopHours').value,
                    ShopStatus: document.getElementById('shopStatus').value,
                    ShopLatitude: parseFloat(lat),
                    ShopLongitude: parseFloat(lon),
                    ShopImage_url: finalImageUrl
                };

                let url = `${API_BASE_URL}/shops/${shopId}`;
                let method = 'PUT';

                if (isCreating) {
                    url = `${API_BASE_URL}/shops/create`;
                    method = 'POST';
                    payload.OwnerID = adminMode ? newOwnerIdInput.value : loggedInUser.OwnerID;
                }

                const response = await fetch(url, {
                    method: method,
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                
                if (!response.ok) throw new Error(result.message || response.statusText);
                
                alert(isCreating ? 'Shop created!' : 'Shop updated!');
                managePopup.style.display = 'none';

                if (isCreating && adminMode) {
                    window.location.href = 'admin_shop.php';
                } else {
                    if(isCreating) {
                        loggedInUser.ShopID = result.ShopID; 
                        localStorage.setItem('laundroUser', JSON.stringify(loggedInUser)); 
                        window.location.reload();
                    } else {
                        fetchShopDetails(); 
                    }
                }

            } catch (error) {
                alert(`Error: ${error.message}`);
            } finally {
                saveBtn.textContent = 'Save Changes';
                saveBtn.disabled = false;
            }
        });

        document.getElementById('configure-shop-btn').addEventListener('click', () => {
             document.getElementById('config-iframe').src = `configure_shop.php?shop_id=${SHOP_ID}&admin_mode=${adminMode}`;
             document.getElementById('shop-details-view').style.display = 'none';
             document.getElementById('config-area').style.display = 'block';
        });

        // INIT
        fetchShopDetails();
    </script>
</body>
</html>