<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Shop Configuration - LaundroLink</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        /* BASE STYLES */
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background-color: #f8f9fa; 
            padding: 0; 
            margin: 0; 
        }

        /* WRAPPER STYLE */
        .main-config-wrapper { 
            max-width: 1100px; 
            margin: 0 auto 40px; 
            padding: 25px 35px 50px 35px; 
            background: white; 
            border-radius: 12px; 
            box-shadow: 0 4px 15px rgba(0,0,0,0.1); 
        }
        
        /* SECTION STYLES */
        h2 { 
            border-bottom: 2px solid #e0eeef; 
            padding-bottom: 8px; 
            margin-top: 30px; 
            color: #004aad; 
            font-size: 20px; 
            font-weight: 600; 
        }
        .config-section { margin-bottom: 40px; }
        
        /* TABLE & FORMS */
        .table-responsive { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #dee2e6; font-size: 14px; }
        th { background-color: #f2f2f2; color: #333; font-weight: 600; }
        
        /* BUTTONS */
        .btn-action { padding: 6px 12px; margin-left: 5px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; transition: background 0.3s; }
        .btn-add { background-color: #1c7430; color: white; margin-bottom: 15px; }
        .btn-add:hover { background-color: #155d27; }
        .btn-edit { background-color: #007bff; color: white; }
        .btn-edit:hover { background-color: #0056b3; }
        .btn-delete { background-color: #dc3545; color: white; }
        .btn-delete:hover { background-color: #c82333; }
        .btn-disable { background-color: #6c757d; color: white; } 
        .btn-disable:hover { background-color: #5a6268; }
        
        .btn-back { 
            background-color: #6c757d; 
            color: white; 
            padding: 8px 15px; 
            border: none; 
            border-radius: 8px; 
            cursor: pointer; 
            font-weight: 600; 
            margin-bottom: 20px; 
            transition: background-color 0.3s; 
        }
        .btn-back:hover { background-color: #5a6268; }

        /* FORMS */
        .add-form { display: flex; flex-wrap: wrap; gap: 15px; align-items: flex-end; margin-top: 15px; padding: 15px; border: 1px solid #ccc; border-radius: 8px; background-color: #fafafa; }
        .add-form input, .add-form select, .add-form textarea { padding: 8px; border: 1px solid #ccc; border-radius: 4px; width: 100%; box-sizing: border-box; }
        .add-form div { display: flex; flex-direction: column; flex-grow: 1; }
        .add-form label { font-size: 12px; color: #555; margin-bottom: 4px; font-weight: 600; }

        /* LOGISTICS TOGGLE STYLES */
        .logistics-toggle-container { display: flex; gap: 20px; margin-bottom: 20px; justify-content: center; }
        .mode-btn {
            padding: 15px 30px; border: 2px solid #e0e0e0; background: white; border-radius: 10px; cursor: pointer;
            font-weight: 600; color: #555; transition: all 0.3s; display: flex; align-items: center; gap: 10px; width: 45%; justify-content: center;
            opacity: 1;
        }
        .mode-btn.active { border-color: #004aad; background-color: #eef7ff; color: #004aad; }
        
        /* Disabled/Locked State */
        .mode-btn.locked {
            opacity: 0.6; cursor: not-allowed; background-color: #f0f0f0; border-color: #ccc; color: #999;
        }
        
        .mode-btn i { font-size: 1.2em; }
        
        /* ALERTS */
        #status-message { margin-top: 20px; padding: 10px; border-radius: 4px; display: none; }
        .status-success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .status-error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    </style>
</head>
<body>
    <div class="main-config-wrapper">
        
        <button class="btn-back" onclick="goBackToDetails()">
            <i class="fas fa-arrow-left"></i> Back to Shop Details
        </button>

        <div id="status-message" role="alert"></div>

        <div class="config-section">
            <h2><i class="fas fa-tags"></i> Services & Pricing</h2>
            <div id="service-add-form" class="add-form">
                <div style="flex-grow: 2;">
                    <label>Service Name</label>
                    <select id="newSvcID"></select>
                </div>
                <div>
                    <label>Price (₱/kg)</label>
                    <input type="number" id="newSvcPrice" step="0.01" placeholder="0.00">
                </div>
                <div>
                    <label>Min Weight (kg)</label>
                    <input type="number" id="newMinWeight" placeholder="e.g. 3">
                </div>
                <button class="btn-action btn-add" onclick="saveService()">Add/Update Service</button>
            </div>
            <div class="table-responsive">
                <table id="services-table">
                    <thead>
                        <tr>
                            <th>Service Name</th>
                            <th>Price</th>
                            <th>Min Weight (kg)</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>

        <div class="config-section">
            <h2><i class="fas fa-motorcycle"></i> Delivery Logistics Setup</h2>
            <p style="color:#666; margin-bottom:10px; font-size:14px;">How do you handle deliveries? Choose your preferred method below.</p>
            <p id="logistics-warning" style="color:#d9534f; font-size:13px; font-weight:600; margin-bottom:20px; min-height:20px;"></p>
            
            <div class="logistics-toggle-container">
                <button class="mode-btn" id="btn-in-house" onclick="handleModeSwitch('in-house')">
                    <i class="fas fa-biking"></i> In-House (Own Riders)
                </button>
                
                <button class="mode-btn" id="btn-partner" onclick="handleModeSwitch('partner')">
                    <i class="fas fa-handshake"></i> 3rd Party Apps
                </button>
            </div>

            <div id="panel-in-house" style="display:none;">
                <div class="add-form" style="background: #eef7ff; border-color: #b8daff;">
                    <div style="width:100%; display:flex; justify-content:space-between; align-items:center;">
                        <strong style="color:#004aad;">Configure Your Rates</strong>
                        <button class="btn-action btn-disable" onclick="disableInHouse()" title="Temporarily disable In-House delivery">
                            <i class="fas fa-ban"></i> Disable / Unuse
                        </button>
                    </div>
                    <div><label>Base Fare (₱)</label><input type="number" id="ownBaseFare" step="0.01" placeholder="e.g. 30.00"></div>
                    <div><label>Base Distance (km)</label><input type="number" id="ownBaseKm" placeholder="e.g. 3"></div>
                    <div><label>Rate per Extra km (₱)</label><input type="number" id="ownDistanceRate" step="0.01" placeholder="e.g. 10.00"></div>
                    <button class="btn-action btn-edit" onclick="saveOwnDeliverySettings()">Save & Enable</button>
                </div>
            </div>

            <div id="panel-partner" style="display:none;">
                <div class="add-form" style="align-items: center; background: #fffbe6; border-color: #ffe58f;">
                    <div style="flex-grow: 2;">
                        <label>Select Delivery App to Link</label>
                        <select id="newAppID"><option value="">-- Select App --</option></select>
                    </div>
                    <button class="btn-action btn-add" onclick="linkDeliveryApp()">Link App</button>
                </div>
                <div class="table-responsive">
                    <table id="linked-apps-table">
                        <thead><tr><th>App Name</th><th>Base Fare</th><th>Base Km</th><th>Per Km Rate</th><th>Action</th></tr></thead>
                        <tbody><tr><td colspan="5" style="text-align:center;">Loading linked apps...</td></tr></tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="config-section">
            <h2><i class="fas fa-pump-soap"></i> Add-Ons (Pricing)</h2>
            <div id="addon-add-form" class="add-form">
                <div><label>Add-On Name</label><select id="newAddOnID"></select></div>
                <div><label>Price (₱)</label><input type="number" id="newAddOnPrice" step="0.01"></div>
                <button class="btn-action btn-add" onclick="saveAddOn()">Set/Update Price</button>
            </div>
            <div class="table-responsive"><table id="addons-table"><thead><tr><th>Add-On Name</th><th>Price (₱)</th><th>Action</th></tr></thead><tbody></tbody></table></div>
        </div>

        <div class="config-section">
            <h2><i class="fas fa-tshirt"></i> Fabric Types (Available)</h2>
            <div id="fabric-add-form" class="add-form">
                <div><label>Fabric Type</label><select id="newFabID"></select></div>
                <button class="btn-action btn-add" onclick="saveFabricType()">Add Fabric</button>
            </div>
            <div class="table-responsive"><table id="fabrics-table"><thead><tr><th>Fabric Type Name</th><th>Action</th></tr></thead><tbody></tbody></table></div>
        </div>

        <div class="config-section">
            <h2><i class="fas fa-clipboard-list"></i> Service Modes</h2>
            <p style="font-size:13px; color:#777; margin-bottom:10px;">Define which modes your shop accepts (e.g., "Drop-off Only", "Pickup & Delivery").</p>
            <div id="delivery-add-form" class="add-form" style="align-items: center;">
                <div style="flex-grow: 2;">
                    <label>Mode Type</label>
                    <select id="newDlvryTypeID"></select>
                </div>
                <button class="btn-action btn-add" onclick="saveDeliveryOption()">Add Mode</button>
            </div>
            <div class="table-responsive">
                <table id="delivery-table">
                    <thead>
                        <tr>
                            <th>Type Name</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>

    </div>

    <script type="module">
        import { API_BASE_URL } from '../api.js'; 

        // 🟢 CRITICAL UPDATE: READ URL PARAMS FIRST (ADMIN SUPPORT)
        const urlParams = new URLSearchParams(window.location.search);
        const adminShopId = urlParams.get('shop_id');

        // Fallback to localStorage if no URL param (Normal Owner Flow)
        const loggedInUser = window.parent.localStorage.getItem('laundroUser') 
            ? JSON.parse(window.parent.localStorage.getItem('laundroUser'))
            : JSON.parse(localStorage.getItem('laundroUser'));
            
        // If adminShopId exists, use it. Otherwise use loggedInUser.ShopID
        const SHOP_ID = adminShopId || loggedInUser?.ShopID;

        console.log("Configuring Shop ID:", SHOP_ID); // Debugging

        // Global Data
        let globalServices = [], globalFabrics = [], globalAddOns = [], globalDeliveryTypes = [], globalDeliveryApps = [];
        
        // State Tracking
        let isPartnerActive = false;
        let isInHouseActive = false;

        // --- NAVIGATION ---
        window.goBackToDetails = () => {
            if (window.parent && window.parent.showMainDetailsView) window.parent.showMainDetailsView();
            else displayMessage("Cannot return to parent view.", 'error');
        };

        function displayMessage(message, type = 'success') {
            const msgEl = document.getElementById('status-message');
            msgEl.textContent = message;
            msgEl.className = `status-message status-${type}`;
            msgEl.style.display = 'block';
            setTimeout(() => msgEl.style.display = 'none', 5000);
        }

        async function fetchData(endpoint, method = 'GET', body = null) {
            if (!SHOP_ID) return null;
            try {
                const finalEndpoint = endpoint.replace(':shopId', SHOP_ID);
                const response = await fetch(`${API_BASE_URL}/shops/${finalEndpoint}`, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: body ? JSON.stringify(body) : null
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || data.error || "API Error");
                return data;
            } catch (error) {
                if(method === 'GET' && !endpoint.includes('own-delivery')) console.warn(error.message);
                else if (method !== 'GET') displayMessage(`API Error: ${error.message}`, 'error');
                return null;
            }
        }

        // --- LOGISTICS STATE MANAGEMENT ---
        function updateLogisticsUI() {
            const btnInHouse = document.getElementById('btn-in-house');
            const btnPartner = document.getElementById('btn-partner');
            const panelInHouse = document.getElementById('panel-in-house');
            const panelPartner = document.getElementById('panel-partner');
            const warningEl = document.getElementById('logistics-warning');

            warningEl.textContent = "";
            btnInHouse.className = "mode-btn";
            btnPartner.className = "mode-btn";

            if (isPartnerActive) {
                btnPartner.classList.add('active');
                btnInHouse.classList.add('locked');
                panelPartner.style.display = 'block';
                panelInHouse.style.display = 'none';
                warningEl.textContent = "ℹ️ You are using 3rd Party Apps. To switch to In-House, you must UNLINK all apps first.";
            } 
            else if (isInHouseActive) {
                btnInHouse.classList.add('active');
                btnPartner.classList.add('locked');
                panelInHouse.style.display = 'block';
                panelPartner.style.display = 'none';
                warningEl.textContent = "ℹ️ You are using In-House Delivery. To switch to 3rd Party Apps, click 'Disable / Unuse' first.";
            } 
            else {
                btnInHouse.classList.add('active');
                panelInHouse.style.display = 'block';
                panelPartner.style.display = 'none';
                warningEl.textContent = "";
            }
        }

        window.handleModeSwitch = (mode) => {
            if (mode === 'in-house') {
                if (isPartnerActive) {
                    alert("Cannot switch: You have active 3rd Party Apps. Please unlink them first.");
                    return;
                }
                document.getElementById('btn-in-house').classList.add('active');
                document.getElementById('btn-partner').classList.remove('active');
                document.getElementById('panel-in-house').style.display = 'block';
                document.getElementById('panel-partner').style.display = 'none';
            } 
            else if (mode === 'partner') {
                if (isInHouseActive) {
                    alert("Cannot switch: In-House Delivery is active. Please click 'Disable / Unuse' inside the In-House panel first.");
                    return;
                }
                document.getElementById('btn-partner').classList.add('active');
                document.getElementById('btn-in-house').classList.remove('active');
                document.getElementById('panel-partner').style.display = 'block';
                document.getElementById('panel-in-house').style.display = 'none';
            }
        };

        // --- LOGISTICS FETCH/SAVE LOGIC ---
        async function fetchOwnDeliverySettings() {
            const data = await fetchData(':shopId/own-delivery');
            if (data && data.settings) {
                isInHouseActive = (data.settings.ShopServiceStatus === 'Active');
                document.getElementById('ownBaseFare').value = data.settings.ShopBaseFare;
                document.getElementById('ownBaseKm').value = data.settings.ShopBaseKm;
                document.getElementById('ownDistanceRate').value = data.settings.ShopDistanceRate;
            } else {
                isInHouseActive = false;
            }
            updateLogisticsUI();
        }

        window.saveOwnDeliverySettings = async () => {
            const payload = {
                ShopID: SHOP_ID,
                ShopBaseFare: document.getElementById('ownBaseFare').value,
                ShopBaseKm: document.getElementById('ownBaseKm').value,
                ShopDistanceRate: document.getElementById('ownDistanceRate').value,
                ShopServiceStatus: 'Active' 
            };
            
            if (!payload.ShopBaseFare || payload.ShopBaseFare <= 0) {
                displayMessage("Base Fare must be greater than 0 to enable In-House.", 'error');
                return;
            }

            if(await fetchData('own-delivery', 'POST', payload)) {
                displayMessage("In-house delivery enabled & saved.");
                fetchOwnDeliverySettings(); 
            }
        };

        window.disableInHouse = async () => {
            if(!confirm("Disable In-House delivery? Your settings will be saved but the service will be inactive.")) return;
            const payload = {
                ShopID: SHOP_ID,
                ShopBaseFare: document.getElementById('ownBaseFare').value,
                ShopBaseKm: document.getElementById('ownBaseKm').value,
                ShopDistanceRate: document.getElementById('ownDistanceRate').value,
                ShopServiceStatus: 'Inactive' 
            };
            if(await fetchData('own-delivery', 'POST', payload)) {
                displayMessage("In-house delivery disabled.");
                fetchOwnDeliverySettings(); 
            }
        };

        // B. Partner Apps
        async function fetchLinkedApps() {
            const data = await fetchData(':shopId/delivery-apps');
            const tbody = document.querySelector('#linked-apps-table tbody');
            tbody.innerHTML = '';
            if (!data?.apps?.length) { 
                isPartnerActive = false;
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No apps linked.</td></tr>'; 
            } else {
                isPartnerActive = true;
                data.apps.forEach(app => {
                    const row = tbody.insertRow();
                    row.innerHTML = `<td>${app.DlvryAppName}</td><td>₱${app.AppBaseFare}</td><td>${app.AppBaseKm}km</td><td>₱${app.AppDistanceRate}/km</td>
                    <td><button class="btn-action btn-delete" onclick="unlinkApp('${app.DlvryAppID}')">Unlink</button></td>`;
                });
            }
            updateLogisticsUI();
        }

        window.linkDeliveryApp = async () => {
            const appId = document.getElementById('newAppID').value;
            if (!appId) return;
            const payload = { ShopID: SHOP_ID, DlvryAppID: appId };
            if(await fetchData('delivery-apps', 'POST', payload)) {
                displayMessage("App linked successfully.");
                fetchLinkedApps();
            }
        };

        window.unlinkApp = async (appId) => {
            if(!confirm("Unlink this delivery app?")) return;
            const payload = { ShopID: SHOP_ID, DlvryAppID: appId }; 
            if(await fetchData('delivery-apps/unlink', 'POST', payload)) {
                displayMessage("App unlinked.");
                fetchLinkedApps(); 
            }
        };

        // --- GLOBAL DATA ---
        async function fetchGlobalData() {
            try {
                const [svc, fab, ao, dlv, apps] = await Promise.all([
                    fetchData('global/services'),
                    fetchData('global/fabrics'),
                    fetchData('global/addons'),
                    fetchData('global/delivery-types'),
                    fetchData('global/delivery-apps')
                ]);
                
                globalServices = svc?.services || [];
                globalFabrics = fab?.fabrics || [];
                globalAddOns = ao?.addons || [];
                globalDeliveryTypes = dlv?.deliveryTypes || [];
                globalDeliveryApps = apps?.apps || [];

                populateDropdown('newSvcID', globalServices, 'SvcID', 'SvcName');
                populateDropdown('newFabID', globalFabrics, 'FabID', 'FabName');
                populateDropdown('newAddOnID', globalAddOns, 'AddOnID', 'AddOnName');
                populateDropdown('newDlvryTypeID', globalDeliveryTypes, 'DlvryTypeID', 'DlvryTypeName');
                populateDropdown('newAppID', globalDeliveryApps, 'DlvryAppID', 'DlvryAppName');

            } catch (e) { console.error("Global data load partial failure", e); }
        }

        function populateDropdown(elementId, data, valueKey, textKey) {
            const select = document.getElementById(elementId);
            if(!select) return;
            select.innerHTML = '<option value="">-- Select --</option>';
            if(!data) return;
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item[valueKey];
                option.textContent = item[textKey];
                select.appendChild(option);
            });
        }

        // --- 1. SERVICES ---
        async function fetchShopServices() {
            const data = await fetchData(':shopId/services');
            const tbody = document.querySelector('#services-table tbody');
            tbody.innerHTML = '';
            if (!data?.services?.length) { tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No services yet.</td></tr>'; return; }
            data.services.forEach(s => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${s.SvcName}</td>
                    <td>₱${parseFloat(s.SvcPrice).toFixed(2)}</td>
                    <td>${s.MinWeight} kg</td>
                    <td><button class="btn-action btn-edit" onclick="editService('${s.SvcID}', '${s.SvcPrice}', '${s.MinWeight}')">Edit</button></td>`;
            });
        }
        window.saveService = async () => {
            const payload = {
                ShopID: SHOP_ID,
                SvcID: document.getElementById('newSvcID').value,
                SvcPrice: document.getElementById('newSvcPrice').value,
                MinWeight: document.getElementById('newMinWeight').value
            };
            if(await fetchData('services', 'POST', payload)) { 
                displayMessage("Service saved."); 
                fetchShopServices(); 
                document.getElementById('newSvcPrice').value = '';
                document.getElementById('newMinWeight').value = '';
            }
        };
        window.editService = (id, price, minWeight) => {
            document.getElementById('newSvcID').value = id;
            document.getElementById('newSvcPrice').value = price;
            document.getElementById('newMinWeight').value = minWeight;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        // --- 3. ADD-ONS ---
        async function fetchShopAddOns() {
            const data = await fetchData(':shopId/addons');
            const tbody = document.querySelector('#addons-table tbody');
            tbody.innerHTML = '';
            if (!data?.addons?.length) { tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No add-ons yet.</td></tr>'; return; }
            data.addons.forEach(a => {
                const row = tbody.insertRow();
                row.innerHTML = `<td>${a.AddOnName}</td><td>₱${a.AddOnPrice}</td>
                <td><button class="btn-action btn-edit" onclick="editAddOn('${a.AddOnID}', '${a.AddOnPrice}')">Edit</button></td>`;
            });
        }
        window.saveAddOn = async () => {
            const payload = { ShopID: SHOP_ID, AddOnID: document.getElementById('newAddOnID').value, AddOnPrice: document.getElementById('newAddOnPrice').value };
            if(await fetchData('addons', 'POST', payload)) { displayMessage("Add-on saved."); fetchShopAddOns(); }
        };
        window.editAddOn = (id, price) => {
            document.getElementById('newAddOnID').value = id;
            document.getElementById('newAddOnPrice').value = price;
        };

        // --- 4. FABRICS ---
        async function fetchShopFabrics() {
            const data = await fetchData(':shopId/fabrics');
            const tbody = document.querySelector('#fabrics-table tbody');
            tbody.innerHTML = '';
            if (!data?.fabrics?.length) { tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;">No fabrics yet.</td></tr>'; return; }
            data.fabrics.forEach(f => {
                const row = tbody.insertRow();
                row.innerHTML = `<td>${f.FabName}</td><td><button class="btn-action btn-delete">Remove</button></td>`;
            });
        }
        window.saveFabricType = async () => {
            const payload = { ShopID: SHOP_ID, FabID: document.getElementById('newFabID').value };
            if(await fetchData('fabrics', 'POST', payload)) { displayMessage("Fabric added."); fetchShopFabrics(); }
        };

        // --- 5. DELIVERY MODES ---
        async function fetchDeliveryOptions() {
            const data = await fetchData(':shopId/delivery');
            const tbody = document.querySelector('#delivery-table tbody');
            tbody.innerHTML = '';
            if (!data?.delivery?.length) { tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;">No modes configured.</td></tr>'; return; }
            data.delivery.forEach(d => {
                const row = tbody.insertRow();
                row.innerHTML = `<td>${d.DlvryTypeName}</td>
                <td><button class="btn-action btn-delete" onclick="deleteDeliveryOption('${d.DlvryID}')">Remove</button></td>`;
            });
        }
        window.saveDeliveryOption = async () => {
            const payload = { ShopID: SHOP_ID, DlvryTypeID: document.getElementById('newDlvryTypeID').value };
            if(await fetchData('delivery', 'POST', payload)) { displayMessage("Mode saved."); fetchDeliveryOptions(); }
        };

        window.deleteDeliveryOption = async (dlvryId) => {
             // backend support for DELETE required
             alert("To remove a mode, backend DELETE route required.");
        };

        document.addEventListener('DOMContentLoaded', () => {
            if (SHOP_ID) {
                fetchGlobalData().then(() => {
                    fetchShopServices();
                    fetchShopAddOns();
                    fetchShopFabrics();
                    fetchDeliveryOptions();
                    Promise.all([fetchOwnDeliverySettings(), fetchLinkedApps()]).then(() => {
                        updateLogisticsUI();
                    });
                });
            } else {
                console.error("No Shop ID found (Admin or Owner context missing).");
                document.querySelector('.main-config-wrapper').innerHTML = '<h2 style="text-align:center;color:red;">Error: No Shop Selected</h2>';
            }
        });
    </script>
</body>
</html>