<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Shop Configuration - LaundroLink</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        /* BASE STYLES: Remove redundant scroll/margin/padding from iframe content */
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background-color: #f8f9fa;
            padding: 0; 
            margin: 0;
        }

        /* WRAPPER STYLE: Only apply styling that was previously on .config-container */
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
        
        /* TABLE STYLES */
        .table-responsive { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #dee2e6; font-size: 14px; }
        th { background-color: #f2f2f2; color: #333; font-weight: 600; }
        
        /* BUTTONS & FORMS */
        .btn-action { padding: 6px 12px; margin-left: 5px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; transition: background 0.3s; }
        .btn-add { background-color: #1c7430; color: white; margin-bottom: 15px; }
        .btn-add:hover { background-color: #155d27; }
        .btn-edit { background-color: #007bff; color: white; }
        .btn-edit:hover { background-color: #0056b3; }
        .btn-delete { background-color: #dc3545; color: white; }
        .btn-delete:hover { background-color: #c82333; }
        
        /* 🔑 New Back Button Style */
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
        .btn-back:hover {
            background-color: #5a6268;
        }

        .add-form { display: flex; flex-wrap: wrap; gap: 15px; align-items: flex-end; margin-top: 15px; padding: 15px; border: 1px solid #ccc; border-radius: 8px; background-color: #fafafa; }
        .add-form input, .add-form select, .add-form textarea { padding: 8px; border: 1px solid #ccc; border-radius: 4px; width: 100%; box-sizing: border-box; }
        .add-form div { display: flex; flex-direction: column; flex-grow: 1; }
        .add-form label { font-size: 12px; color: #555; margin-bottom: 4px; font-weight: 600; }

        /* Status and Alerts */
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
                <div>
                    <label for="newSvcID">Service Name</label>
                    <select id="newSvcID" required>
                        <option value="">-- Loading Services --</option>
                    </select>
                </div>
                <div>
                    <label for="newSvcPrice">Price (₱/kg)</label>
                    <input type="number" id="newSvcPrice" step="0.01" placeholder="e.g., 50.00" required>
                </div>
                <div>
                    <label for="newMinLoad">Min Load (kg)</label>
                    <input type="number" id="newMinLoad" placeholder="e.g., 5" required>
                </div>
                <div>
                    <label for="newMaxLoad">Max Load (kg)</label>
                    <input type="number" id="newMaxLoad" placeholder="e.g., 8" required>
                </div>
                <button class="btn-action btn-add" onclick="saveService()">Add/Update Service</button>
            </div>

            <div class="table-responsive">
                <table id="services-table">
                    <thead>
                        <tr>
                            <th>Service Name</th>
                            <th>Price (₱/kg)</th>
                            <th>Min Load (kg)</th>
                            <th>Max Load (kg)</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="5" style="text-align:center;">Loading configured services...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="config-section">
            <h2><i class="fas fa-tshirt"></i> Fabric Types (Available)</h2>
            <div id="fabric-add-form" class="add-form">
                <div>
                    <label for="newFabID">Fabric Type</label>
                    <select id="newFabID" required>
                        <option value="">-- Loading Fabrics --</option>
                    </select>
                </div>
                <button class="btn-action btn-add" onclick="saveFabricType()">Add Fabric to Shop</button>
            </div>
            
            <div class="table-responsive">
                <table id="fabrics-table">
                    <thead>
                        <tr>
                            <th>Global ID</th>
                            <th>Fabric Type Name</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="3" style="text-align:center;">Loading shop fabrics...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="config-section">
            <h2><i class="fas fa-pump-soap"></i> Add-Ons (Pricing)</h2>
            <div id="addon-add-form" class="add-form">
                <div>
                    <label for="newAddOnID">Add-On Name</label>
                    <select id="newAddOnID" required>
                        <option value="">-- Loading Add-Ons --</option>
                    </select>
                </div>
                <div>
                    <label for="newAddOnPrice">Price (₱)</label>
                    <input type="number" id="newAddOnPrice" step="0.01" placeholder="e.g., 25.00" required>
                </div>
                <button class="btn-action btn-add" onclick="saveAddOn()">Set/Update Price</button>
            </div>

            <div class="table-responsive">
                <table id="addons-table">
                    <thead>
                        <tr>
                            <th>Global ID</th>
                            <th>Add-On Name</th>
                            <th>Price (₱)</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="4" style="text-align:center;">Loading configured add-ons...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="config-section">
            <h2><i class="fas fa-truck-loading"></i> Delivery Options</h2>
            <div id="delivery-add-form" class="add-form" style="align-items: flex-start;">
                <div style="flex-grow: 0.5;">
                    <label for="newDlvryTypeID">Delivery Type</label>
                    <select id="newDlvryTypeID" required>
                        <option value="">-- Loading Types --</option>
                    </select>
                </div>
                <div style="flex-grow: 2;">
                    <label for="newDlvryDescription">Shop Description (Override)</label>
                    <textarea id="newDlvryDescription" rows="2" placeholder="Enter shop-specific description..." required></textarea>
                </div>
                <button class="btn-action btn-add" onclick="saveDeliveryOption()">Add/Update Option</button>
            </div>

            <div class="table-responsive">
                <table id="delivery-table">
                    <thead>
                        <tr>
                            <th>Shop ID</th>
                            <th>Type Name</th>
                            <th>Description</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="4" style="text-align:center;">Loading delivery options...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script type="module">
        import { API_BASE_URL } from '../api.js'; 

        // Retrieve user details safely from the parent window's localStorage
        const loggedInUser = window.parent.localStorage.getItem('laundroUser') 
            ? JSON.parse(window.parent.localStorage.getItem('laundroUser'))
            : JSON.parse(localStorage.getItem('laundroUser'));
            
        const SHOP_ID = loggedInUser?.ShopID;

        // Global arrays to store fetched global data
        let globalServices = [];
        let globalFabrics = [];
        let globalAddOns = [];
        let globalDeliveryTypes = [];

        // 🔑 FUNCTION TO COMMUNICATE BACK TO PARENT (manage_shop.php)
        window.goBackToDetails = () => {
            // This function relies on a global function being defined in the parent window (manage_shop.php)
            // It triggers the parent to switch the view back to main shop details.
            if (window.parent && window.parent.showMainDetailsView) {
                window.parent.showMainDetailsView();
            } else {
                displayMessage("Cannot return to parent view. Parent script function not found.", 'error');
            }
        };


        // --- UTILITY FUNCTIONS ---

        function displayMessage(message, type = 'success') {
            const msgEl = document.getElementById('status-message');
            msgEl.textContent = message;
            msgEl.className = `status-message status-${type}`;
            msgEl.style.display = 'block';
            setTimeout(() => msgEl.style.display = 'none', 5000);
        }

        async function fetchData(endpoint, method = 'GET', body = null) {
            if (!SHOP_ID && endpoint.includes(':shopId')) {
                displayMessage("Error: Shop ID is missing. Please create your shop first.", 'error');
                return null;
            }
            try {
                const finalEndpoint = endpoint.replace(':shopId', SHOP_ID);

                const response = await fetch(`${API_BASE_URL}/shops/${finalEndpoint}`, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: body ? JSON.stringify(body) : null
                });
                const data = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(data.message || data.error || "Failed API operation.");
                }
                return data;
            } catch (error) {
                displayMessage(`API Error: ${error.message}`, 'error');
                return null;
            }
        }
        
        // --- GLOBAL DROPDOWN POPULATION ---
        
        async function fetchGlobalData() {
            try {
                const [svc, fab, ao, dlv] = await Promise.all([
                    fetchData('global/services'),
                    fetchData('global/fabrics'),
                    fetchData('global/addons'),
                    fetchData('global/delivery-types')
                ]);
                globalServices = svc?.services || [];
                globalFabrics = fab?.fabrics || [];
                globalAddOns = ao?.addons || [];
                globalDeliveryTypes = dlv?.deliveryTypes || [];
                
                populateServiceDropdown();
                populateFabricDropdown();
                populateAddOnDropdown();
                populateDeliveryTypeDropdown();
            } catch (e) {
                 displayMessage("Error loading global configuration data.", 'error');
            }
        }

        function populateServiceDropdown() {
            const select = document.getElementById('newSvcID');
            select.innerHTML = '<option value="">-- Select Service --</option>';
            globalServices.forEach(svc => {
                const option = document.createElement('option');
                option.value = svc.SvcID;
                option.textContent = svc.SvcName;
                select.appendChild(option);
            });
        }
        
        function populateFabricDropdown() {
            const select = document.getElementById('newFabID');
            select.innerHTML = '<option value="">-- Select Fabric --</option>';
            globalFabrics.forEach(fab => {
                const option = document.createElement('option');
                option.value = fab.FabID;
                option.textContent = fab.FabName;
                select.appendChild(option);
            });
        }
        
        function populateAddOnDropdown() {
            const select = document.getElementById('newAddOnID');
            select.innerHTML = '<option value="">-- Select Add-On --</option>';
            globalAddOns.forEach(ao => {
                const option = document.createElement('option');
                option.value = ao.AddOnID;
                option.textContent = ao.AddOnName;
                select.appendChild(option);
            });
        }
        
        function populateDeliveryTypeDropdown() {
            const select = document.getElementById('newDlvryTypeID');
            select.innerHTML = '<option value="">-- Select Delivery Type --</option>';
            globalDeliveryTypes.forEach(dlv => {
                const option = document.createElement('option');
                option.value = dlv.DlvryTypeID;
                option.textContent = dlv.DlvryTypeName;
                select.appendChild(option);
            });
            // Optional: Add event listener to pre-fill description with global default
            select.addEventListener('change', (e) => {
                const type = globalDeliveryTypes.find(d => d.DlvryTypeID === e.target.value);
                document.getElementById('newDlvryDescription').value = type ? type.DlvryDescription : '';
            });
        }

        // --- 1. SHOP SERVICES LOGIC ---

        async function fetchShopServices() {
            const tableBody = document.querySelector('#services-table tbody');
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading configured services...</td></tr>';
            const data = await fetchData(':shopId/services');
            
            if (data && data.services) {
                tableBody.innerHTML = '';
                if (data.services.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No services configured yet.</td></tr>';
                    return;
                }
                data.services.forEach(svc => {
                    const row = tableBody.insertRow();
                    row.innerHTML = `
                        <td>${svc.SvcName}</td>
                        <td>₱${parseFloat(svc.SvcPrice).toFixed(2)}</td>
                        <td>${svc.MinLoad}</td>
                        <td>${svc.MaxLoad}</td>
                        <td>
                            <button class="btn-action btn-edit" onclick="editService('${svc.SvcID}', ${svc.SvcPrice}, ${svc.MinLoad}, ${svc.MaxLoad})">Edit</button>
                        </td>
                    `;
                });
            }
        }

        window.saveService = async () => {
            const SvcID = document.getElementById('newSvcID').value;
            const SvcPrice = document.getElementById('newSvcPrice').value;
            const MinLoad = document.getElementById('newMinLoad').value;
            const MaxLoad = document.getElementById('newMaxLoad').value;

            if (!SvcID || !SvcPrice || !MinLoad || !MaxLoad) {
                displayMessage("Please fill all service fields.", 'error');
                return;
            }

            const payload = { 
                ShopID: SHOP_ID, 
                SvcID: SvcID, 
                SvcPrice: parseFloat(SvcPrice), 
                MinLoad: parseInt(MinLoad), 
                MaxLoad: parseInt(MaxLoad) 
            };
            
            const result = await fetchData('services', 'POST', payload);
            if (result) {
                displayMessage("Service price updated successfully.");
                fetchShopServices();
                document.getElementById('service-add-form').reset();
                document.querySelector('#service-add-form .btn-add').textContent = 'Add/Update Service';
            }
        };

        window.editService = (svcId, price, minLoad, maxLoad) => {
            document.getElementById('newSvcID').value = svcId;
            document.getElementById('newSvcPrice').value = price;
            document.getElementById('newMinLoad').value = minLoad;
            document.getElementById('newMaxLoad').value = maxLoad;
            document.querySelector('#service-add-form .btn-add').textContent = 'Update Service';
        };


        // --- 2. SHOP FABRIC TYPES LOGIC ---

        async function fetchShopFabrics() {
            const tableBody = document.querySelector('#fabrics-table tbody');
            tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Loading shop fabrics...</td></tr>';
            const data = await fetchData(':shopId/fabrics');
            
            if (data && data.fabrics) {
                tableBody.innerHTML = '';
                if (data.fabrics.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No fabrics linked yet.</td></tr>';
                    return;
                }
                data.fabrics.forEach(fab => {
                    const row = tableBody.insertRow();
                    row.innerHTML = `
                        <td>${fab.FabID}</td>
                        <td>${fab.FabName}</td>
                        <td>
                            <button class="btn-action btn-delete" onclick="deleteFabricType('${fab.FabID}')">Remove</button>
                        </td>
                    `;
                });
            }
        }

        window.saveFabricType = async () => {
            const FabID = document.getElementById('newFabID').value;
            if (!FabID) {
                displayMessage("Please select a fabric type.", 'error');
                return;
            }
            
            const payload = { ShopID: SHOP_ID, FabID };
            const result = await fetchData('fabrics', 'POST', payload);
            if (result) {
                displayMessage("Fabric type linked successfully.");
                fetchShopFabrics();
                document.getElementById('fabric-add-form').reset();
            }
        };
        
        window.deleteFabricType = async (fabId) => {
            if (!confirm(`Are you sure you want to remove this fabric type (ID: ${fabId}) from your shop?`)) return;
            
            // NOTE: You need to implement DELETE /api/shops/fabrics/:shopId/:fabId in shops.js
            displayMessage("Deletion logic not implemented in the API yet.", 'error');
        };


        // --- 3. SHOP ADD-ONS LOGIC ---

        async function fetchShopAddOns() {
            const tableBody = document.querySelector('#addons-table tbody');
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading configured add-ons...</td></tr>';
            const data = await fetchData(':shopId/addons');

            if (data && data.addons) {
                tableBody.innerHTML = '';
                if (data.addons.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No add-ons configured yet.</td></tr>';
                    return;
                }
                data.addons.forEach(ao => {
                    const row = tableBody.insertRow();
                    row.innerHTML = `
                        <td>${ao.AddOnID}</td>
                        <td>${ao.AddOnName}</td>
                        <td>₱${parseFloat(ao.AddOnPrice).toFixed(2)}</td>
                        <td>
                            <button class="btn-action btn-edit" onclick="editAddOn('${ao.AddOnID}', ${ao.AddOnPrice})">Edit Price</button>
                        </td>
                    `;
                });
            }
        }

        window.saveAddOn = async () => {
            const AddOnID = document.getElementById('newAddOnID').value;
            const AddOnPrice = document.getElementById('newAddOnPrice').value;
            if (!AddOnID || !AddOnPrice) {
                 displayMessage("Please select an add-on and set a price.", 'error');
                 return;
            }
            
            const payload = { ShopID: SHOP_ID, AddOnID, AddOnPrice: parseFloat(AddOnPrice) };
            const result = await fetchData('addons', 'POST', payload);
            if (result) {
                displayMessage("Add-on price updated successfully.");
                fetchShopAddOns();
                document.getElementById('addon-add-form').reset();
                document.querySelector('#addon-add-form .btn-add').textContent = 'Set/Update Price';
            }
        };
        
        window.editAddOn = (addOnId, price) => {
            document.getElementById('newAddOnID').value = addOnId;
            document.getElementById('newAddOnPrice').value = price;
            document.querySelector('#addon-add-form .btn-add').textContent = 'Update Price';
        };

        window.deleteAddOn = async (addOnId) => {
            if (!confirm(`Are you sure you want to delete this add-on (ID: ${addOnId})?`)) return;
            displayMessage("Deletion logic for add-ons needs a PUT/DELETE API route.", 'error');
        };


        // --- 4. SHOP DELIVERY OPTIONS LOGIC ---

        async function fetchShopDeliveryOptions() {
            const tableBody = document.querySelector('#delivery-table tbody');
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading delivery options...</td></tr>';
            const data = await fetchData(':shopId/delivery');

            if (data && data.delivery) {
                tableBody.innerHTML = '';
                if (data.delivery.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No delivery options configured yet.</td></tr>';
                    return;
                }
                data.delivery.forEach(dlvry => {
                    const row = tableBody.insertRow();
                    row.innerHTML = `
                        <td>${dlvry.DlvryID}</td>
                        <td>${dlvry.DlvryTypeName}</td>
                        <td>${dlvry.DlvryDescription}</td>
                        <td>
                            <button class="btn-action btn-edit" onclick="editDeliveryOption('${dlvry.DlvryTypeID}', '${dlvry.DlvryDescription}')">Edit</button>
                        </td>
                    `;
                });
            }
        }

        window.saveDeliveryOption = async () => {
            const DlvryTypeID = document.getElementById('newDlvryTypeID').value;
            const DlvryDescription = document.getElementById('newDlvryDescription').value;
            if (!DlvryTypeID || !DlvryDescription) {
                 displayMessage("Please select a delivery type and provide a description.", 'error');
                 return;
            }
            
            const payload = { ShopID: SHOP_ID, DlvryTypeID, DlvryDescription };
            const result = await fetchData('delivery', 'POST', payload);
            if (result) {
                displayMessage("Delivery option saved successfully.");
                fetchShopDeliveryOptions();
                document.getElementById('delivery-add-form').reset();
                document.querySelector('#delivery-add-form .btn-add').textContent = 'Add/Update Option';
            }
        };
        
        window.editDeliveryOption = (typeId, description) => {
            document.getElementById('newDlvryTypeID').value = typeId;
            document.getElementById('newDlvryDescription').value = description;
            document.querySelector('#delivery-add-form .btn-add').textContent = 'Update Option';
        };

        window.deleteDeliveryOption = async (dlvryId) => {
            if (!confirm(`Are you sure you want to delete this delivery option (ID: ${dlvryId})?`)) return;
            displayMessage("Deletion logic for delivery needs a PUT/DELETE API route.", 'error');
        };


        // --- INITIALIZATION ---
        document.addEventListener('DOMContentLoaded', () => {
            if (!SHOP_ID) {
                return;
            }
            fetchGlobalData();
            fetchShopServices();
            fetchShopFabrics();
            fetchShopAddOns();
            fetchShopDeliveryOptions();
        });
    </script>
</body>
</html>