<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Data Analytics</title>
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
  />
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8f9fa;
      margin: 0;
    }

    .title-box {
        background: white;
        border-radius: 10px;
        max-width: 1100px;
        margin: 30px auto 40px;
        padding: 25px 40px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }

    .title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
    }

    h1 {
      color: #004aad;
      margin-bottom: 8px;
    }

    p {
      color: #555;
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
      align-items: start;
      max-width: 1100px;
      margin: 0 auto;
    }

    .right-column {
      display: flex;
      flex-direction: column;
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
      margin: 0 0 25px 0;
      padding-bottom: 15px;
      border-bottom: 1px solid #f1f3f5;
    }

    #segments-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
      gap: 18px;
    }

    .segment {
      background: #fff;
      border-radius: 15px;
      padding: 18px;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
      border-left: 6px solid #007bff;
      transition: all 0.25s ease;
      animation: fadeInUp 0.5s ease;
    }

    .segment:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
    }

    .segment-header {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
    }

    .segment-icon {
      font-size: 30px;
      line-height: 1;
      padding: 14px;
      border-radius: 12px;
      color: white;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-right: 14px;
    }

    .icon-high-value {
      background: linear-gradient(90deg, #fbb034, #ff6600);
    }

    .icon-loyal {
      background: linear-gradient(90deg, #0072ff, #0046ad);
    }

    .icon-risk {
      background: linear-gradient(90deg, #ff416c, #ff4b2b);
    }

    .icon-new {
      background: linear-gradient(90deg, #00c6ff, #0072ff);
    }

    .icon-default {
      background: linear-gradient(90deg, #757575, #444444);
    }

    .segment-title h4 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .segment-title p {
      margin: 0;
      color: #777;
      font-size: 14px;
    }

    .segment-stats {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 14px;
    }

    .stat-item {
      text-align: center;
    }

    .stat-item-label {
      color: #888;
      font-size: 13px;
    }

    .stat-item-value {
      font-weight: bold;
      color: #333;
    }

    .suggestion {
      font-size: 13px;
      color: #555;
      margin-top: 10px;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
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

  <!-- 🔹 TITLE BOX SECTION -->
  <div class="title-box">
    <div class="title-row">
      <div>
        <h1>Data Analytics & Insights</h1>
        <p>Gain deeper insights into customer behavior, service trends, and shop performance.</p>
      </div>
    </div>
  </div>

  <!-- 🔹 MAIN CONTENT -->
  <div class="analytics-grid">
    <div class="card">
      <h3>Customer Segments</h3>
      <div id="segments-container">Loading segments...</div>
    </div>

    <div class="right-column">
      <div class="card">
        <h3>Most Popular Services</h3>
        <div id="services-chart-container">Loading chart...</div>
      </div>

      <div class="card">
        <h3>Busiest Times of Day</h3>
        <p style="font-size: 14px; color: #6c757d; margin-top: -15px; margin-bottom: 25px;">
          Understand when your shop is busiest to optimize staff scheduling.
        </p>
        <div id="busiest-times-chart-container">Loading chart...</div>
      </div>
    </div>
  </div>

  <script type="module">
    import { API_BASE_URL } from '../api.js'; 

    const loggedInUser = JSON.parse(window.parent.localStorage.getItem('laundroUser'));

    /* ================================
       1️⃣ CUSTOMER SEGMENTS
    ================================ */
    async function fetchAndDisplaySegments() {
      const container = document.getElementById("segments-container");
      if (!loggedInUser?.ShopID) {
        container.innerHTML = "<p>Could not identify shop.</p>";
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/analytics/segment-details/${loggedInUser.ShopID}`
        );
        if (!response.ok) throw new Error("Failed to fetch segments");
        const segments = await response.json();

        if (segments.length === 0) {
          container.innerHTML = "<p>No customer segment data available yet.</p>";
          return;
        }

        const segmentStyles = {
          "Loyal High-Spender": {
            icon: '<i class="fas fa-crown"></i>',
            class: "icon-high-value",
            suggestion: "Offer premium deals or subscription packages.",
          },
          "Frequent Customer": {
            icon: '<i class="fas fa-sync-alt"></i>',
            class: "icon-loyal",
            suggestion: "Reward consistent loyalty with points or vouchers.",
          },
          "Recent Customer": {
            icon: '<i class="fas fa-star"></i>',
            class: "icon-new",
            suggestion: "Send a thank-you message and ask for a review.",
          },
          Occasional: {
            icon: '<i class="fas fa-handshake"></i>',
            class: "icon-risk",
            suggestion: "Re-engage them with a limited-time discount.",
          },
        };

        container.innerHTML = segments
          .map((segment) => {
            const style =
              segmentStyles[segment.SegmentName] || {
                icon: '<i class="fas fa-user-circle"></i>',
                class: "icon-default",
                suggestion: "Keep communication active with this group.",
              };

            return `
              <div class="segment" style="border-left-color: ${getSegmentColor(
                style.class
              )};">
                <div class="segment-header">
                  <div class="segment-icon ${style.class}">${style.icon}</div>
                  <div class="segment-title">
                    <h4>${segment.SegmentName}</h4>
                    <p>${segment.customerCount} Customers</p>
                  </div>
                </div>
                <div class="segment-stats">
                  <div class="stat-item">
                    <div class="stat-item-label">Avg. Spend</div>
                    <div class="stat-item-value">₱${parseFloat(
                      segment.averageSpend
                    ).toFixed(2)}</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-item-label">Avg. Orders</div>
                    <div class="stat-item-value">${parseFloat(
                      segment.averageFrequency
                    ).toFixed(1)}</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-item-label">Last Seen</div>
                    <div class="stat-item-value">${Math.round(
                      segment.averageRecency
                    )} days ago</div>
                  </div>
                </div>
                <p class="suggestion"><strong>Suggestion:</strong> ${
                  style.suggestion
                }</p>
              </div>
            `;
          })
          .join("");

        function getSegmentColor(className) {
          switch (className) {
            case "icon-high-value":
              return "#f7714c";
            case "icon-loyal":
              return "#00c6ff";
            case "icon-risk":
              return "#ff758c";
            case "icon-new":
              return "#6ec6ff";
            default:
              return "#d3d3d3";
          }
        }
      } catch (error) {
        console.error("Error fetching segments:", error);
        container.innerHTML = "<p>Error loading segment data.</p>";
      }
    }

    /* ================================
       2️⃣ POPULAR SERVICES
    ================================ */
    async function fetchAndDisplayServices() {
      const container = document.getElementById('services-chart-container');
      if (!loggedInUser?.ShopID) { container.innerHTML = '<p>Could not identify shop.</p>'; return; }
      try {
        const response = await fetch(`${API_BASE_URL}/analytics/popular-services/${loggedInUser.ShopID}`);
        if (!response.ok) throw new Error('Failed to fetch services');
        const services = await response.json();
        if (services.length === 0) { container.innerHTML = '<p>No service data available yet.</p>'; return; }
        const maxOrders = Math.max(...services.map(s => s.orderCount), 1);
        container.innerHTML = services.map(service => `
          <div class="chart-bar-container">
            <div class="chart-label">${service.SvcName}</div>
            <div class="bar-wrapper">
              <div class="chart-bar" style="width: 0%; background: linear-gradient(90deg, #43cea2, #185a9d);">${service.orderCount}</div>
            </div>
          </div>
        `).join('');
        setTimeout(() => {
          document.querySelectorAll('#services-chart-container .chart-bar').forEach((bar, index) => {
            bar.style.width = `${(services[index].orderCount / maxOrders) * 100}%`;
          });
        }, 100);
      } catch (error) {
        console.error('Error fetching services:', error);
        container.innerHTML = '<p>Error loading service data.</p>';
      }
    }

    /* ================================
       3️⃣ BUSIEST TIMES
    ================================ */
    async function fetchAndDisplayBusiestTimes() {
      const container = document.getElementById('busiest-times-chart-container');
      if (!loggedInUser?.ShopID) { container.innerHTML = '<p>Could not identify shop.</p>'; return; }
      try {
        const response = await fetch(`${API_BASE_URL}/analytics/busiest-times/${loggedInUser.ShopID}`);
        if (!response.ok) throw new Error('Failed to fetch busiest times');
        const times = await response.json();
        if (times.length === 0) { container.innerHTML = '<p>No order data to determine busiest times.</p>'; return; }
        const maxOrders = Math.max(...times.map(t => t.orderCount), 1);
        container.innerHTML = times.map(time => `
          <div class="chart-bar-container">
            <div class="chart-label">${time.timeSlot}</div>
            <div class="bar-wrapper">
              <div class="chart-bar" style="width: 0%; background: linear-gradient(90deg, #fdc830, #f37335);">${time.orderCount} Orders</div>
            </div>
          </div>
        `).join('');
        setTimeout(() => {
          document.querySelectorAll('#busiest-times-chart-container .chart-bar').forEach((bar, index) => {
            bar.style.width = `${(times[index].orderCount / maxOrders) * 100}%`;
          });
        }, 100);
      } catch (error) {
        console.error('Error fetching busiest times:', error);
        container.innerHTML = '<p>Error loading busiest times data.</p>';
      }
    }

    fetchAndDisplaySegments();
    fetchAndDisplayServices();
    fetchAndDisplayBusiestTimes();
  </script>
</body>
</html>
