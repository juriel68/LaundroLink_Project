<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Data Analytics</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            padding: 20px;
            margin: 0;
        }
        .container-title {
            font-size: 28px;
            font-weight: 700;
            color: #1e3a8a;
            margin-bottom: 30px;
        }
        .analytics-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        .card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
        }
        .card h3 {
            font-size: 20px;
            font-weight: 600;
            color: #343a40;
            margin: 0 0 20px 0;
        }
        .segment {
            display: flex;
            align-items: flex-start;
            margin-bottom: 25px;
        }
        .segment-icon {
            font-size: 24px;
            padding: 12px;
            border-radius: 8px;
            margin-right: 20px;
            color: white;
            background-color: #007bff;
            width: 24px; /* Fixed width */
            text-align: center;
        }
        .segment-info h4 {
            margin: 0 0 5px 0;
            font-size: 16px;
            color: #495057;
        }
        .segment-info p {
            margin: 0;
            font-size: 14px;
            color: #6c757d;
        }
        .suggestion {
            font-style: italic;
            color: #007bff;
            font-size: 13px;
            margin-top: 8px;
        }
        .chart-bar-container {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }
        .chart-label {
            width: 150px;
            font-size: 14px;
            color: #495057;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex-shrink: 0; /* Prevent label from shrinking */
            margin-right: 15px; /* Add space between label and bar */
        }
        /* NEW WRAPPER FOR THE BAR */
        .bar-wrapper {
            flex-grow: 1; /* This will fill the remaining horizontal space */
            background-color: #e9ecef; /* Optional: adds a track for the bar */
            border-radius: 4px;
        }
        .chart-bar {
            background: linear-gradient(90deg, #00c6ff, #007bff);
            height: 25px;
            border-radius: 4px;
            color: white;
            font-size: 12px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 10px;
            transition: width 0.5s ease-out;
        }
    </style>
</head>
<body>

    <h2 class="container-title">🔍 Data Analytics & Insights</h2>
    <div class="analytics-grid">
        <div class="card">
            <h3>Customer Segments</h3>
            <div id="segments-container">Loading segments...</div>
        </div>
        <div class="card">
            <h3>Most Popular Services</h3>
            <div id="services-chart-container">Loading chart...</div>
        </div>
    </div>

    <script type="module">
        // The path must go up one directory from 'owner_pages' to find 'api.js'
        import { API_BASE_URL } from '../api.js'; 
        
        const loggedInUser = JSON.parse(window.parent.localStorage.getItem('laundroUser'));

        async function fetchAndDisplaySegments() {
            // ... (This function is correct and remains the same)
            const container = document.getElementById('segments-container');
            if (!loggedInUser?.ShopID) {
                container.innerHTML = '<p>Could not identify shop.</p>';
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/analytics/segments/${loggedInUser.ShopID}`);
                if (!response.ok) throw new Error('Failed to fetch segments');
                const segments = await response.json();

                if (segments.length === 0) {
                    container.innerHTML = '<p>No customer segment data available yet.</p>';
                    return;
                }

                const segmentDetails = {
                    'High-Value Spenders': { icon: '💎', suggestion: 'Offer them premium service add-ons.' },
                    'Loyal Regulars': { icon: '❤️', suggestion: 'Provide a loyalty bonus on their 10th order.' },
                    'At-Risk Customers': { icon: '👋', suggestion: "Send a 'We Miss You!' discount code." },
                    'New or Occasional': { icon: '✨', suggestion: 'Encourage repeat business with a small discount on their next visit.' },
                };

                container.innerHTML = segments.map(segment => `
                    <div class="segment">
                        <div class="segment-icon">${segmentDetails[segment.SegmentName]?.icon || '👥'}</div>
                        <div class="segment-info">
                            <h4>${segment.SegmentName} (${segment.customerCount})</h4>
                            <p class="suggestion">${segmentDetails[segment.SegmentName]?.suggestion || ''}</p>
                        </div>
                    </div>
                `).join('');
            } catch (error) {
                console.error('Error fetching segments:', error);
                container.innerHTML = '<p>Error loading segment data.</p>';
            }
        }

        async function fetchAndDisplayServices() {
            const container = document.getElementById('services-chart-container');
             if (!loggedInUser?.ShopID) {
                container.innerHTML = '<p>Could not identify shop.</p>';
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/analytics/popular-services/${loggedInUser.ShopID}`);
                if (!response.ok) throw new Error('Failed to fetch services');
                const services = await response.json();

                if (services.length === 0) {
                    container.innerHTML = '<p>No service data available yet.</p>';
                    return;
                }

                const maxOrders = Math.max(...services.map(s => s.orderCount), 1);
                
                // UPDATED HTML STRUCTURE FOR THE BAR CHART
                container.innerHTML = services.map(service => `
                    <div class="chart-bar-container">
                        <div class="chart-label">${service.SvcName}</div>
                        <div class="bar-wrapper">
                            <div class="chart-bar" style="width: 0%;"> 
                                ${service.orderCount}
                            </div>
                        </div>
                    </div>
                `).join('');
                
                setTimeout(() => {
                    document.querySelectorAll('.chart-bar').forEach((bar, index) => {
                        const service = services[index];
                        bar.style.width = `${(service.orderCount / maxOrders) * 100}%`;
                    });
                }, 100);

            } catch (error) {
                console.error('Error fetching services:', error);
                container.innerHTML = '<p>Error loading service data.</p>';
            }
        }
        
        fetchAndDisplaySegments();
        fetchAndDisplayServices();
    </script>
</body>
</html>