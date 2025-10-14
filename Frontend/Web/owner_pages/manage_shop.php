<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Shop - LaundroLink</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            background-color: #f8f9fa; 
            overflow: hidden;
        }

        .title-box { 
            background: white; 
            border-radius: 10px; 
            max-width: 1100px; 
            margin: 30px auto 20px; 
            padding: 25px 35px; 
            box-shadow: 0 4px 10px rgba(0,0,0,0.1); 
        }

        h1 { 
            color: #004aad;
            margin-bottom: 8px; 
        }

        p { 
            color: #555; 
            margin: 0; 
        }

        .shop-details-container {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 30px;
            max-width: 1100px;
            margin: 0 auto 40px;
            align-items: flex-start;
        }
        
        .details-column .shop-card {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
        }
        .shop-header { 
            text-align: center; 
            margin-bottom: 25px; 
        }

        .shop-name { 
            font-weight: 700; 
            font-size: 28px; 
            color: #004aad; 
            margin-bottom: 8px; 
        }

        .shop-descrp { 
            color: #555; 
            font-size: 15px; 
            line-height: 1.6; 
            font-style: italic; 
        }

        .details-box { 
            background: #f8f9fa; 
            border-radius: 8px; 
            padding: 20px; 
            margin: 25px 0; 
        }

        .shop-detail { 
            display: flex; 
            align-items: center; 
            gap: 12px; 
            font-size: 15px; 
            color: #333; 
            margin-bottom: 12px; 
        }

        .shop-detail:last-child { 
            margin-bottom: 0; 
        }

        .shop-detail .icon { 
            color: #004aad; 
            width: 20px; 
            text-align: center; 
        }

        .status-container { 
            text-align: center; 
            margin-bottom: 25px; 
        }

        .shop-status { 
            display: inline-block; 
            font-size: 14px; 
            font-weight: 600; 
            padding: 6px 16px; 
            border-radius: 20px; 
        }

        .status-available { 
            color: #1c7430; 
            background: #e8f7ed; 
        }

        .status-closed { 
            color: #a72825; 
            background: #f7e8e8; 
        }

        .btn-edit { 
            background-color: #004aad; 
            color: white; 
            border: none; 
            border-radius: 8px; 
            padding: 12px 25px; 
            cursor: pointer; 
            text-decoration: none; 
            font-size: 16px; 
            font-weight: 600; 
            transition: all 0.3s ease; 
            width: 100%;
        }

        .btn-edit:hover { 
            background-color: #003c8a; 
        }

        /* === Enhanced Ratings Section === */
        .reviews-column h2 { 
            font-size: 22px;
            color: #004aad; 
            margin-bottom: 20px; 
        }

        .rating-summary { 
            background: white; 
            border-radius: 15px; 
            padding: 25px; 
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08); 
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        }

        .rating-main {
            text-align: center;
        }

        .rating-score { 
            font-size: 3rem; 
            font-weight: 700; 
            color: #333; 
        }

        .rating-stars { 
            font-size: 1.2rem; 
            margin-top: 5px; 
        }

        .rating-stars .fas.fa-star { 
            color: #ffc107; 
        }

        .rating-stars .far.fa-star { 
            color: #e0e0e0; 
        }

        .rating-count { 
            font-size: 14px; 
            color: #555; 
            margin-top: 10px; 
        }

        .no-reviews { 
            font-style: italic; 
            color: #777; 
        }

        /* New Breakdown Styles */
        .rating-breakdown {
            width: 100%;
            max-width: 280px;
        }

        .rating-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 6px 0;
            font-size: 14px;
            color: #444;
        }

        .rating-row .bar {
            flex-grow: 1;
            height: 8px;
            background: #e9ecef;
            border-radius: 5px;
            overflow: hidden;
        }

        .rating-row .bar-fill {
            height: 100%;
            background: #ffc107;
            border-radius: 5px;
            transition: width 0.4s ease;
        }

        .rating-row .star-label {
            width: 30px;
            text-align: right;
        }

        /* === Popup Styles === */
        .popup { 
            display: none; 
            position: fixed; 
            z-index: 999; 
            left: 0; 
            top: 0; 
            width: 100%; 
            height: 100%; 
            background-color: rgba(0,0,0,0.5); 
            overflow-y: auto; 
        }

        .popup-content { 
            background-color: #fff; 
            margin: 5% auto; 
            padding: 30px; 
            border-radius: 12px; 
            width: 420px; 
            box-shadow: 0 6px 16px rgba(0,0,0,0.25); 
            max-height: 90vh; 
            overflow-y: auto; 
            animation: fadeIn 0.3s ease; 
        }

        .popup-content h2 { 
            color: #004aad; 
            margin-bottom: 20px; 
            text-align: center; 
        }

        .popup-content label { 
            font-weight: 500; 
            font-size: 14px; 
            color: #333; 
            display: block; 
            margin-top: 10px; 
        }

        .popup-content input, 
        .popup-content textarea, 
        .popup-content select { 
            width: 100%; 
            padding: 10px; 
            margin-top: 6px; 
            border-radius: 6px; 
            border: 1px solid #ccc; 
            font-size: 14px; 
            box-sizing: border-box;
        }

        .popup-buttons { 
            text-align: right; 
            margin-top: 25px; 
        }

        .btn-cancel { 
            background-color: #ccc; 
            color: #333; 
            padding: 10px 18px; 
            border-radius: 6px; 
            border: none; 
            cursor: pointer; 
            margin-right: 10px; 
            font-weight: 500; 
        }

        .btn-save { 
            background-color: #004aad; 
            color: white; 
            padding: 10px 18px; 
            border-radius: 6px; 
            border: none; 
            cursor: pointer; 
            font-weight: 500; 
        }

        .btn-save:hover { 
            background-color: #003c8a; 
        }

        @keyframes fadeIn { 
            from {opacity: 0; transform: translateY(-10px);} 
            to {opacity: 1; transform: translateY(0);} 
        }
    </style>
</head>
<body>

    <div class="title-box">
        <h1>My Shop Details</h1>
        <p>View and manage your laundry shop's information and customer feedback.</p>
    </div>

    <div class="shop-details-container">
        <div class="details-column">
            <div class="shop-card">
                <div class="shop-header">
                    <h2 class="shop-name" id="shop-name-display">Loading...</h2>
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
            </div>
        </div>

        <!-- Enhanced Ratings Section -->
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

    <div id="managePopup" class="popup">
        <div class="popup-content">
            <h2>Manage Shop</h2>
            <form id="manageForm">
                <input type="hidden" id="shopID">
                <label>Shop Name</label>
                <input type="text" id="shopName" required>
                <label>Description</label>
                <textarea id="shopDescrp" rows="3" required></textarea>
                <label>Address</label>
                <input type="text" id="shopAddress" required>
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

    <script type="module">
        import { API_BASE_URL } from '/Web/api.js';

        const loggedInUser = JSON.parse(localStorage.getItem('laundroUser'));
        const managePopup = document.getElementById('managePopup');
        const manageForm = document.getElementById('manageForm');

        const shopNameEl = document.getElementById('shop-name-display');
        const shopDescrpEl = document.getElementById('shop-descrp-display');
        const shopAddressEl = document.getElementById('shop-address-display');
        const shopPhoneEl = document.getElementById('shop-phone-display');
        const shopHoursEl = document.getElementById('shop-hours-display');
        const shopStatusEl = document.getElementById('shop-status-display');
        const avgRatingScoreEl = document.getElementById('avg-rating-score');
        const ratingStarsEl = document.getElementById('rating-stars');
        const ratingCountEl = document.getElementById('rating-count');

        const updateShopInfo = (details) => {
            shopNameEl.textContent = details.ShopName;
            shopDescrpEl.textContent = details.ShopDescrp;
            shopAddressEl.textContent = details.ShopAddress;
            shopPhoneEl.textContent = details.ShopPhone;
            shopHoursEl.textContent = details.ShopOpeningHours;
            shopStatusEl.textContent = details.ShopStatus;
            shopStatusEl.className = `shop-status status-${details.ShopStatus.toLowerCase()}`;
        };

        const updateRatingSummary = (rating) => {
            const avg = parseFloat(rating.averageRating || 0);
            const count = parseInt(rating.ratingCount || 0);
            const breakdown = rating.breakdown || {}; // e.g., {5:10, 4:4, 3:2, 2:1, 1:0}

            if (count === 0) {
                avgRatingScoreEl.textContent = 'N/A';
                ratingCountEl.textContent = 'No reviews yet';
                ratingStarsEl.innerHTML = '<span class="no-reviews">No ratings</span>';
                document.getElementById('rating-breakdown').innerHTML = '';
                return;
            }

            avgRatingScoreEl.textContent = avg.toFixed(1);
            ratingCountEl.textContent = `Based on ${count} review${count === 1 ? '' : 's'}`;

            let starsHTML = '';
            const fullStars = Math.floor(avg);
            const halfStar = (avg - fullStars) >= 0.5 ? 1 : 0;
            const emptyStars = 5 - fullStars - halfStar;

            for (let i = 0; i < fullStars; i++) starsHTML += '<i class="fas fa-star"></i>';
            if (halfStar) starsHTML += '<i class="fas fa-star-half-alt"></i>';
            for (let i = 0; i < emptyStars; i++) starsHTML += '<i class="far fa-star"></i>';
            ratingStarsEl.innerHTML = starsHTML;

            const breakdownContainer = document.getElementById('rating-breakdown');
            breakdownContainer.innerHTML = '';
            for (let i = 5; i >= 1; i--) {
                const starCount = breakdown[i] || 0;
                const percent = count > 0 ? (starCount / count) * 100 : 0;
                breakdownContainer.innerHTML += `
                    <div class="rating-row">
                        <span class="star-label">${i}★</span>
                        <div class="bar"><div class="bar-fill" style="width:${percent}%"></div></div>
                        <span>${starCount}</span>
                    </div>
                `;
            }
        };

        const fetchShopDetails = async () => {
            if (!loggedInUser || !loggedInUser.ShopID) {
                document.body.innerHTML = '<h1>Error: Could not find your Shop ID. Please log in again.</h1>';
                return;
            }
            try {
                const response = await fetch(`${API_BASE_URL}/shops/${loggedInUser.ShopID}/details`);
                if (!response.ok) throw new Error('Failed to fetch shop details');
                
                const data = await response.json();
                updateShopInfo(data.details);
                updateRatingSummary(data.rating);
            } catch (error) {
                console.error("Fetch error:", error);
                document.querySelector('.shop-details-container').innerHTML = `<p style="text-align:center; width:100%;">Error loading shop details.</p>`;
            }
        };

        document.getElementById('edit-details-btn').addEventListener('click', () => {
            document.getElementById('shopID').value = loggedInUser.ShopID;
            document.getElementById('shopName').value = shopNameEl.textContent;
            document.getElementById('shopDescrp').value = shopDescrpEl.textContent;
            document.getElementById('shopAddress').value = shopAddressEl.textContent;
            document.getElementById('shopPhone').value = shopPhoneEl.textContent;
            document.getElementById('shopHours').value = shopHoursEl.textContent;
            document.getElementById('shopStatus').value = shopStatusEl.textContent;
            managePopup.style.display = 'block';
        });

        manageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const shopId = document.getElementById('shopID').value;
            const data = {
                ShopName: document.getElementById('shopName').value,
                ShopDescrp: document.getElementById('shopDescrp').value,
                ShopAddress: document.getElementById('shopAddress').value,
                ShopPhone: document.getElementById('shopPhone').value,
                ShopOpeningHours: document.getElementById('shopHours').value,
                ShopStatus: document.getElementById('shopStatus').value
            };
            try {
                const response = await fetch(`${API_BASE_URL}/shops/${shopId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || result.message);
                alert('Shop updated successfully!');
                managePopup.style.display = 'none';
                fetchShopDetails();
            } catch (error) {
                console.error("Update error:", error);
                alert(`Error: ${error.message}`);
            }
        });

        document.getElementById('cancelBtn').addEventListener('click', () => { managePopup.style.display = 'none'; });
        window.onclick = (event) => { if (event.target === managePopup) managePopup.style.display = 'none'; };

        fetchShopDetails();
    </script>
</body>
</html>
