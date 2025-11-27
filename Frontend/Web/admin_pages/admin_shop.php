<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Shop List - LaundroLink Admin</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f9fbfd;
            margin: 0;
            padding: 20px;
        }

        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .page-header h2 {
            color: #0077b6;
            margin: 0;
            font-size: 24px;
        }

        /* Search & Filter Bar */
        .toolbar {
            display: flex;
            gap: 15px;
            background: white;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            margin-bottom: 20px;
            align-items: center;
        }

        .search-box {
            position: relative;
            flex-grow: 1;
            max-width: 400px;
        }

        .search-box input {
            width: 100%;
            padding: 10px 10px 10px 35px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            outline: none;
        }

        .search-box input:focus {
            border-color: #0077b6;
        }

        .search-box i {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #888;
        }

        /* Table Styles */
        .table-container {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            overflow: hidden;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        thead {
            background-color: #f1f5f9;
        }

        th, td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #eee;
            font-size: 14px;
            vertical-align: middle;
        }

        th {
            font-weight: 600;
            color: #444;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 0.5px;
        }

        tr:hover {
            background-color: #f8f9fa;
        }

        /* Status Badges */
        .badge {
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: capitalize;
            display: inline-block;
            min-width: 60px;
            text-align: center;
        }
        .badge.available, .badge.open { background-color: #d4edda; color: #155724; }
        .badge.closed { background-color: #f8d7da; color: #721c24; }
        .badge.inactive { background-color: #e2e3e5; color: #383d41; }

        /* Buttons */
        .btn-manage {
            background-color: #0077b6;
            color: white;
            border: none;
            padding: 8px 14px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            transition: background 0.2s;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }

        .btn-manage:hover {
            background-color: #005f8d;
        }

        /* Pagination */
        .pagination {
            display: flex;
            justify-content: flex-end;
            padding: 15px;
            gap: 5px;
        }

        .pagination button {
            padding: 6px 12px;
            border: 1px solid #ddd;
            background: white;
            cursor: pointer;
            border-radius: 4px;
            color: #555;
        }

        .pagination button.active {
            background-color: #0077b6;
            color: white;
            border-color: #0077b6;
        }

        .pagination button:disabled {
            background-color: #f0f0f0;
            color: #aaa;
            cursor: not-allowed;
        }
    </style>
</head>
<body>

    <div class="page-header">
        <h2>Manage Shops</h2>
    </div>

    <div class="toolbar">
        <div class="search-box">
            <i class="fas fa-search"></i>
            <input type="text" id="searchInput" placeholder="Search by Shop Name, ID, or Address...">
        </div>
        <div style="margin-left: auto; color: #666; font-size: 14px;">
            Total Shops: <strong id="totalCount">0</strong>
        </div>
    </div>

    <div class="table-container">
        <table id="shopsTable">
            <thead>
                <tr>
                    <th width="10%">Shop ID</th>
                    <th width="15%">Owner ID</th>
                    <th width="20%">Shop Name</th>
                    <th width="30%">Address</th>
                    <th width="10%">Status</th>
                    <th width="15%" style="text-align: center;">Action</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td colspan="6" style="text-align:center; padding: 30px; color: #888;">Loading shops...</td>
                </tr>
            </tbody>
        </table>
        
        <div class="pagination" id="paginationControls"></div>
    </div>

    <script type="module">
        // Adjust path if necessary (e.g., '../api.js' if this file is in /admin_pages/)
        import { API_BASE_URL } from '../api.js'; 

        let allShops = [];
        let filteredShops = [];
        let currentPage = 1;
        const itemsPerPage = 8;

        const tableBody = document.querySelector('#shopsTable tbody');
        const searchInput = document.getElementById('searchInput');
        const totalCountEl = document.getElementById('totalCount');
        const paginationEl = document.getElementById('paginationControls');

        // --- 1. FETCH DATA ---
        async function fetchShops() {
            try {
                // Calls the updated backend route that includes OwnerID
                const response = await fetch(`${API_BASE_URL}/shops`);
                if (!response.ok) throw new Error("Failed to fetch shops");
                
                const data = await response.json();
                allShops = data.shops || [];
                filteredShops = [...allShops];
                
                renderTable();
            } catch (error) {
                console.error(error);
                tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Error loading data. Please ensure backend is running.</td></tr>`;
            }
        }

        // --- 2. RENDER TABLE ---
        function renderTable() {
            const start = (currentPage - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const paginatedItems = filteredShops.slice(start, end);

            totalCountEl.textContent = filteredShops.length;
            tableBody.innerHTML = '';

            if (paginatedItems.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px;">No shops found matching your search.</td></tr>`;
                paginationEl.innerHTML = '';
                return;
            }

            paginatedItems.forEach(shop => {
                // Ensure OwnerID is displayed properly (Handle nulls/undefined)
                const ownerIdDisplay = shop.OwnerID 
                    ? `<span style="font-family:monospace; color:#004aad;">${shop.OwnerID}</span>` 
                    : '<span style="color:#aaa; font-style:italic;">Unassigned</span>';
                
                // Status Styling
                let statusClass = 'inactive';
                const status = shop.availability || 'Unknown';
                if (status === 'Open' || status === 'Available') statusClass = 'available';
                else if (status === 'Closed') statusClass = 'closed';

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>#${shop.id}</td>
                    <td>${ownerIdDisplay}</td>
                    <td style="font-weight:600; color:#333;">${shop.name}</td>
                    <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color:#555;">
                        ${shop.address}
                    </td>
                    <td><span class="badge ${statusClass}">${status}</span></td>
                    <td style="text-align: center;">
                        <button class="btn-manage" onclick="manageShop(${shop.id})">
                            <i class="fas fa-cog"></i> Manage
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            renderPagination();
        }

        // --- 3. PAGINATION ---
        function renderPagination() {
            const totalPages = Math.ceil(filteredShops.length / itemsPerPage);
            paginationEl.innerHTML = '';

            if (totalPages <= 1) return;

            // Prev Button
            const prevBtn = document.createElement('button');
            prevBtn.innerText = 'Prev';
            prevBtn.disabled = currentPage === 1;
            prevBtn.onclick = () => { currentPage--; renderTable(); };
            paginationEl.appendChild(prevBtn);

            // Page Numbers (Limit to show around current page)
            for (let i = 1; i <= totalPages; i++) {
                if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                    const btn = document.createElement('button');
                    btn.innerText = i;
                    if (i === currentPage) btn.classList.add('active');
                    btn.onclick = () => { currentPage = i; renderTable(); };
                    paginationEl.appendChild(btn);
                } else if (i === currentPage - 2 || i === currentPage + 2) {
                    const span = document.createElement('span');
                    span.innerText = '...';
                    span.style.padding = '5px';
                    span.style.color = '#999';
                    paginationEl.appendChild(span);
                }
            }

            // Next Button
            const nextBtn = document.createElement('button');
            nextBtn.innerText = 'Next';
            nextBtn.disabled = currentPage === totalPages;
            nextBtn.onclick = () => { currentPage++; renderTable(); };
            paginationEl.appendChild(nextBtn);
        }

        // --- 4. SEARCH LOGIC ---
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            filteredShops = allShops.filter(shop => 
                shop.name.toLowerCase().includes(term) || 
                String(shop.id).includes(term) ||
                (shop.OwnerID && shop.OwnerID.toLowerCase().includes(term)) ||
                shop.address.toLowerCase().includes(term)
            );
            currentPage = 1; 
            renderTable();
        });

        // --- 5. ACTION HANDLER (GLOBAL) ---
        // This function is called when "Manage" is clicked
        window.manageShop = (shopId) => {
            // 🟢 Directs to the shared manage_shop.php
            // 🟢 Passes 'admin_mode=true' to unlock editing
            window.location.href = `manage_shop.php?shop_id=${shopId}&admin_mode=true`;
        };

        // Initialize
        fetchShops();
    </script>

</body>
</html>