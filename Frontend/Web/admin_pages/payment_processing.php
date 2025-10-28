<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Payment Processing | Admin</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #cce5ff;
            margin: 0;
            padding: 40px;
        }

        .container {
            background: #fff;
            border-radius: 12px;
            max-width: 1000px;
            margin: 0 auto;
            padding: 25px 30px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }

        h2 {
            color: #0077b6;
            font-size: 24px;
            margin-bottom: 5px;
        }

        p {
            color: #555;
            margin-bottom: 20px;
        }

        /* --- Filter Styles --- */
        .filter-controls {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-bottom: 25px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 8px;
        }

        .filter-group {
            display: flex;
            flex-direction: column;
            min-width: 180px; 
        }

        .filter-group label {
            font-size: 14px;
            color: #333;
            margin-bottom: 5px;
            font-weight: 600;
        }

        /* *** CRITICAL CSS FIX: Use !important to override external stylesheet conflicts *** */
        .filter-group select, 
        .filter-group input[type="date"] {
            padding: 8px 10px !important;
            border: 1px solid #ced4da !important;
            border-radius: 4px !important;
            font-size: 14px !important;
            min-width: 150px;
            width: 100%; 
            box-sizing: border-box;
            
            /* Overrides to ensure it looks like a standard input/dropdown */
            background-color: white !important; 
            color: #333 !important; 
            /* Force the element to render as a dropdown menu list (removes button appearance) */
            appearance: menulist !important; 
            -webkit-appearance: menulist !important;
            -moz-appearance: menulist !important;
            height: auto !important; 
            cursor: pointer !important;
        }

        /* ** FIX FOR THE UNWANTED BLUE BUTTON ** */
        /* Assuming the blue button is a sibling element in the HTML which needs to be hidden */
        .filter-group button {
            display: none !important;
        }

        /* If the unwanted blue button is NOT a `<button>` but another element like a styled `<div>`
           you might need to find its class or ID and hide it specifically.
           For now, we'll ensure only the <select> and <input> are styled. */
        
        /* --- Table Styles --- */
        
        .table-header {
            display: flex;
            background-color: #0077b6;
            color: #fff;
            font-weight: 600;
            padding: 12px 16px;
            border-radius: 8px 8px 0 0;
            margin-top: 15px;
        }

        .col-customer { flex: 2; }
        .col-shop { flex: 2; }
        .col-amount { flex: 1.5; text-align: right; }
        /* NOTE: Check column name here! It should be 'Date Completed' or 'col-date' */
        .col-date { flex: 2.5; } 
        .col-method { flex: 1.5; }
        .col-status { flex: 1; }

        table {
            width: 100%;
            border-collapse: collapse;
            overflow: hidden;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
            display: block; 
        }

        thead { display: none; }
        tbody { display: block; }

        tr {
            display: flex;
            width: 100%;
            border-bottom: 1px solid #ddd;
        }

        tr:last-child { border-bottom: none; }
        tr:hover { background-color: #f2f6ff; }
        
        td {
            padding: 12px 16px;
            text-align: left;
        }
        
        .status { font-weight: bold; }
        .status.Paid { color: #28a745; }
        .status.Rejected, .status.Error { color: #dc3545; }
        .status.Pending, .status.Processing, .status.ForDelivery { color: #ffc107; }
        
    </style>
</head>
<body>

    <div class="container">
        <h2>Payment Processing</h2>
        <p>Handle and monitor completed customer payments. Use filters below to search specific shops or dates.</p>

        <div class="filter-controls">
            <div class="filter-group">
                <label for="shopFilter">Filter by Shop</label>
                <select id="shopFilter" onchange="fetchPayments()">
                    <option value="">All Shops</option>
                    </select>
                </div>

            <div class="filter-group">
                <label for="startDate">Date Completed (From)</label>
                <input type="date" id="startDate" onchange="fetchPayments()">
            </div>
            <div class="filter-group">
                <label for="endDate">Date Completed (To)</label>
                <input type="date" id="endDate" onchange="fetchPayments()">
            </div>
        </div>

        <div class="table-header">
            <div class="col-customer">Customer</div>
            <div class="col-shop">Shop</div>
            <div class="col-amount" style="text-align: right;">Amount</div>
            <div class="col-date">Date Completed</div> 
            <div class="col-method">Method</div>
            <div class="col-status">Status</div>
        </div>
        
        <div id="paymentTableContainer">
            <table style="border-radius: 0 0 8px 8px;"> 
                <tbody id="paymentTableBody">
                    </tbody>
            </table>
            <div id="loadingMessage" style="text-align: center; padding: 20px;">Loading payments...</div>
        </div>

    </div>

    <script type="module">
        import { API_BASE_URL } from '../api.js'; 

        // --- Utility Functions (Same as before) ---

        function formatDate(dateString) {
            if (!dateString) return 'N/A';
            const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            return new Date(dateString).toLocaleDateString('en-US', options);
        }

        function toggleLoading(isLoading, message = 'Fetching data...') {
            const tableContainer = document.getElementById('paymentTableContainer');
            const loadingMessage = document.getElementById('loadingMessage');
            const tableElement = tableContainer.querySelector('table');
            
            if (isLoading) {
                loadingMessage.style.display = 'block';
                loadingMessage.innerHTML = message;
                tableElement.style.display = 'none';
            } else {
                loadingMessage.style.display = 'none';
                tableElement.style.display = 'block';
            }
        }

        function renderPayments(payments) {
            const tableBody = document.getElementById('paymentTableBody');
            tableBody.innerHTML = ''; 
            
            if (payments.length === 0) {
                toggleLoading(true, 'No payments found for the selected filters.');
                return;
            }

            toggleLoading(false); 

            payments.forEach(p => {
                const row = document.createElement('tr');
                // The status class needs to be stripped of spaces to match CSS: 'For Delivery' -> 'ForDelivery'
                const statusClass = p.status ? p.status.replace(/\s/g, '') : '';

                row.innerHTML = `
                    <td class="col-customer">${p.customerName || 'N/A'}</td>
                    <td class="col-shop">${p.shopName || 'N/A'}</td>
                    <td class="col-amount" style="text-align: right;">₱${parseFloat(p.amount).toFixed(2)}</td>
                    <td class="col-date">${formatDate(p.dateCompleted)}</td>
                    <td class="col-method">${p.paymentMethod || 'N/A'}</td>
                    <td class="col-status status ${statusClass}">${p.status || 'Unknown'}</td>
                `;
                tableBody.appendChild(row);
            });
        }
        
        // --- Core Logic (Same as before) ---

        window.fetchPayments = async () => {
            toggleLoading(true, 'Fetching payments...');
            
            const shopId = document.getElementById('shopFilter').value;
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;

            if (startDate > endDate && startDate && endDate) {
                toggleLoading(true, 'Start Date cannot be after End Date.');
                return;
            }

            const params = new URLSearchParams();
            if (shopId) { params.append('shopId', shopId); }
            if (startDate) { params.append('startDate', startDate); }
            if (endDate) { params.append('endDate', endDate); }

            try {
                const response = await fetch(`${API_BASE_URL}/payments/admin?${params.toString()}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                const payments = await response.json();
                renderPayments(payments);

            } catch (error) {
                console.error("Error fetching payments:", error);
                toggleLoading(true, `❌ Failed to load payment data. Check your API server and console.`);
            }
        }

        async function populateShopFilter() {
            try {
                const selectElement = document.getElementById('shopFilter');
                
                // Fetch shops
                const response = await fetch(`${API_BASE_URL}/payments/shops`);
                if (!response.ok) throw new Error('Failed to fetch shop list');
                const shops = await response.json();
                
                // Add dynamic options
                shops.forEach(shop => {
                    const option = document.createElement('option');
                    option.value = shop.ShopID;
                    option.textContent = shop.ShopName;
                    selectElement.appendChild(option);
                });

            } catch (error) {
                console.error("Error populating shop filter:", error);
                // This ensures the user knows the filter failed to load
                document.getElementById('shopFilter').options[0].textContent = "⚠️ Filter Failed";
            }
        }

        // --- Initialization ---
        document.addEventListener('DOMContentLoaded', () => {
            // 1. Populate the shop dropdown
            populateShopFilter();
            // 2. Fetch data with initial settings
            fetchPayments();
        });
    </script>

</body>
</html>