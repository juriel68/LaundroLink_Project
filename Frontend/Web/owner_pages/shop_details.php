<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Shop Details - LaundroLink</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; background-color: #f8f9fa; overflow: auto; }
        .title-box { background: white; border-radius: 10px; max-width: 1100px; margin: 30px auto 20px; padding: 25px 35px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        h1 { color: #004aad; margin-bottom: 8px; }
        p { color: #555; margin: 0; }
        .shop-details-container { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; max-width: 1100px; margin: 0 auto 40px; align-items: flex-start; }
        .details-column .shop-card { background: white; border-radius: 15px; padding: 30px; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08); }
        .shop-header { text-align: center; margin-bottom: 25px; }
        .shop-image-display { width: 150px; height: 150px; border-radius: 50%; object-fit: cover; margin: 0 auto 20px; border: 4px solid #f0f4f8; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .image-placeholder { width: 100%; height: 100%; background: #e9ecef; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: #ccc; }
        .shop-name { font-weight: 700; font-size: 28px; color: #004aad; margin-bottom: 8px; }
        .shop-descrp { color: #555; font-size: 15px; line-height: 1.6; font-style: italic; }
        .details-box { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0; }
        .shop-detail { display: flex; align-items: center; gap: 12px; font-size: 15px; color: #333; margin-bottom: 12px; }
        .shop-detail .icon { color: #004aad; width: 20px; text-align: center; }
        .status-container { text-align: center; margin-bottom: 25px; }
        .shop-status { display: inline-block; font-size: 14px; font-weight: 600; padding: 6px 16px; border-radius: 20px; }
        .status-available { color: #1c7430; background: #e8f7ed; }
        .status-closed { color: #a72825; background: #f7e8e8; }
        
        /* Ratings Styles */
        .reviews-column h2 { font-size: 22px; color: #004aad; margin-bottom: 20px; }
        .rating-summary { background: white; border-radius: 15px; padding: 25px; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08); text-align: center; display: flex; flex-direction: column; align-items: center; gap: 20px; }
        .rating-score { font-size: 3rem; font-weight: 700; color: #333; }
        .rating-stars .fas.fa-star { color: #ffc107; }
        .rating-stars .far.fa-star { color: #e0e0e0; }
        .rating-count { font-size: 14px; color: #555; margin-top: 10px; }
        .rating-row { display: flex; align-items: center; gap: 8px; margin: 6px 0; font-size: 14px; color: #444; width: 100%; }
        .rating-row .bar { flex-grow: 1; height: 8px; background: #e9ecef; border-radius: 5px; overflow: hidden; }
        .rating-row .bar-fill { height: 100%; background: #ffc107; border-radius: 5px; }
        
        /* Info Message */
        .info-msg {
            background-color: #e3f2fd;
            color: #0d47a1;
            padding: 15px;
            border-radius: 8px;
            font-size: 14px;
            text-align: center;
            margin-top: 20px;
            border: 1px solid #bbdefb;
        }
    </style>
</head>
<body>

    <div class="title-box">
        <h1>My Shop Details</h1>
        <p>This view is read-only. To update details or configure services, please contact an Administrator.</p>
    </div>

    <div id="shop-main-content">
        <p style="text-align:center; margin-top: 50px;">Loading details...</p>
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
                
                <div class="info-msg">
                    <i class="fas fa-info-circle"></i> Need to change something? <br>Contact Admin support.
                </div>
            </div>
        </div>

        <div class="reviews-column">
            <h2>Customer Ratings</h2>
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

    <script type="module">
        import { API_BASE_URL } from '../api.js'; 

        const loggedInUser = JSON.parse(localStorage.getItem('laundroUser'));
        const SHOP_ID = loggedInUser?.ShopID;

        const shopMainContent = document.getElementById('shop-main-content');
        const shopDetailsView = document.getElementById('shop-details-view');

        // Display Elements
        const shopNameEl = document.getElementById('shop-name-display');
        const shopDescrpEl = document.getElementById('shop-descrp-display');
        const shopAddressEl = document.getElementById('shop-address-display');
        const shopPhoneEl = document.getElementById('shop-phone-display');
        const shopHoursEl = document.getElementById('shop-hours-display');
        const shopStatusEl = document.getElementById('shop-status-display');
        const shopImageDisplay = document.getElementById('shop-image-display');
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

            if (details.ShopImage_url) {
                shopImageDisplay.innerHTML = `<img src="${details.ShopImage_url}" alt="Shop Logo" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            } else {
                shopImageDisplay.innerHTML = `<div class="image-placeholder"><i class="fas fa-camera" style="font-size: 30px;"></i></div>`;
            }
        };

        const updateRatingSummary = (rating) => {
             const avg = parseFloat(rating.averageRating || 0);
             const count = parseInt(rating.ratingCount || 0);
             avgRatingScoreEl.textContent = avg.toFixed(1);
             ratingCountEl.textContent = `Based on ${count} review${count === 1 ? '' : 's'}`;
             
             let starsHTML = '';
             for (let i = 0; i < Math.floor(avg); i++) starsHTML += '<i class="fas fa-star"></i>';
             if (avg % 1 >= 0.5) starsHTML += '<i class="fas fa-star-half-alt"></i>';
             ratingStarsEl.innerHTML = starsHTML || '<span class="no-reviews">No ratings</span>';
             
             const breakdownContainer = document.getElementById('rating-breakdown');
             breakdownContainer.innerHTML = '';
             for (let i = 5; i >= 1; i--) {
                 const starCount = rating.breakdown[i] || 0;
                 const percent = count > 0 ? (starCount / count) * 100 : 0;
                 breakdownContainer.innerHTML += `
                    <div class="rating-row">
                        <span class="star-label">${i}★</span>
                        <div class="bar"><div class="bar-fill" style="width:${percent}%"></div></div>
                        <span>${starCount}</span>
                    </div>`;
             }
        };

        const fetchShopDetails = async () => {
            if (!SHOP_ID) {
                shopMainContent.innerHTML = `<p style="text-align:center;">No Shop Linked.</p>`;
                return;
            }
            shopMainContent.innerHTML = '';
            shopDetailsView.style.display = 'grid';

            try {
                const response = await fetch(`${API_BASE_URL}/shops/${SHOP_ID}/full-details-owner`);
                if (!response.ok) throw new Error('Failed to fetch shop details');
                const data = await response.json();
                
                updateShopInfo(data.details);
                updateRatingSummary(data.rating);
            } catch (error) {
                shopDetailsView.style.display = 'none';
                shopMainContent.innerHTML = `<p style="text-align:center;">Error: ${error.message}</p>`;
            }
        };

        fetchShopDetails();
    </script>
</body>
</html>