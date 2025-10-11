<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Data Analytics</title>
    <style>
        body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      height: 100vh;
      overflow: hidden; 
    }
        /* Top box styling */
    .section {
      background: white;
            border-radius: 10px;
            max-width: 1100px;
            margin: 30px auto 40px;
            padding: 25px 40px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }


        .section h1 {
            color: #004aad;
            margin-bottom: 8px;
        }

        .section p {
            color: #333;
            margin: 0;
        }

        /* 🔹 Grid container for analytics cards */
        .analytics-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            max-width: 1000px;
            margin: 40px auto 0 auto;
            margin-top: 50px;
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
            width: 24px;
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
            flex-shrink: 0;
            margin-right: 15px;
        }

        .bar-wrapper {
            flex-grow: 1;
            background-color: #e9ecef;
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

    <!-- 🔹 Top section box -->
    <div class="section">
        <h1>Data Analytics & Insights</h1>
        <p>Analyze customer behavior and identify popular services to improve business performance.</p>
    </div>

    <!-- 🔹 Analytics cards -->
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
        import { API_BASE_URL } from '../api.js'; 
        
        const loggedInUser = JSON.parse(window.parent.localStorage.getItem('laundroUser'));

        async function fetchAndDisplaySegments() {
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
