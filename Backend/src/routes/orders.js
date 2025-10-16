import express from "express";
import db from "../db.js";

const router = express.Router();

// POST /api/orders
router.post("/", async (req, res) => {
    const {
        CustID,         // Customer ID (must exist in Customers/Users)
        ShopID,         // Shop ID (must exist in Laundry_Shops)
        SvcID,          // Service ID (must exist in Services/Shop_Services)
        StaffID,        // Staff ID (optional/can be null)
        deliveryId,     // Delivery Option ID (DlvryID from Delivery_Options)
        weight,         // Initial laundry weight (Kilogram)
        instructions,   // Special instructions
        fabrics,        // Fabrics JSON array (optional)
        addons          // Addons JSON array (optional)
    } = req.body;

    // Basic validation
    if (!CustID || !ShopID || !SvcID || !deliveryId || weight === undefined) {
        return res.status(400).json({ success: false, message: "Missing required fields (CustID, ShopID, SvcID, deliveryId, weight)." });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Insert into Laundry_Details (for weight and instructions)
        const newLndryDtlID = generateID('LD');
        await connection.query(
            "INSERT INTO Laundry_Details (LndryDtlID, Kilogram, Instructions, FabricsJson, AddonsJson) VALUES (?, ?, ?, ?, ?)",
            [newLndryDtlID, weight, instructions || null, fabrics ? JSON.stringify(fabrics) : null, addons ? JSON.stringify(addons) : null]
        );

        // 2. Generate the main OrderID
        // This is a complex ID generation, simplified here with a unique prefix+timestamp.
        // You may need a more robust sequential ID generator like the one in auth.js.
        const newOrderID = generateID('O');

        // 3. Insert into the main Orders table
        await connection.query(
            "INSERT INTO Orders (OrderID, CustID, ShopID, SvcID, StaffID, LndryDtlID, DlvryID, OrderCreatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
            [newOrderID, CustID, ShopID, SvcID, StaffID || null, newLndryDtlID, deliveryId]
        );

        // 4. Set initial status to 'Pending'
        const newOrderStatId = generateID('OSD');
        await connection.query(
            "INSERT INTO Order_Status (OrderStatID, OrderID, OrderStatus, OrderUpdatedAt) VALUES (?, ?, 'Pending', NOW())",
            [newOrderStatId, newOrderID]
        );

        // 5. Create an initial Invoice record (to be updated later with pricing)
        // Since we don't know the PayAmount yet, we initialize it.
        const newInvoiceID = generateID('INV');
        await connection.query(
            "INSERT INTO Invoices (InvoiceID, OrderID, PayAmount) VALUES (?, ?, ?)",
            [newInvoiceID, newOrderID, 0.00] // Initial amount is 0.00
        );

        // 6. Set initial Invoice_Status
        const newInvoiceStatID = generateID('IS');
         await connection.query(
            "INSERT INTO Invoice_Status (StatID, InvoiceID, InvoiceStatus, StatUpdateAt) VALUES (?, ?, 'Draft', NOW())",
            [newInvoiceStatID, newInvoiceID]
        );

        await connection.commit();

        res.status(201).json({ 
            success: true, 
            message: "Order created successfully with initial details.", 
            orderId: newOrderID 
        });

    } catch (error) {
        await connection.rollback();
        console.error("❌ Create order error:", error);
        res.status(500).json({ success: false, message: "Failed to create order." });
    } finally {
        connection.release();
    }
});

// ✅ MODIFIED: The query has been rewritten for accuracy and reliability.
router.get("/shop/:shopId", async (req, res) => {
  const { shopId } = req.params;
  try {
    const [rows] = await db.query(
      `
      WITH LatestOrderStatus AS (
        SELECT
            OrderID,
            OrderStatus,
            OrderUpdatedAt,
            ROW_NUMBER() OVER (PARTITION BY OrderID ORDER BY OrderUpdatedAt DESC) as rn
        FROM Order_Status
      )
      SELECT 
        o.OrderID AS orderId,
        o.CustID AS customerId,
        o.ShopID AS shopId,
        o.SvcID AS serviceId,
        o.LndryDtlID AS laundryDetailId,
        o.DlvryID AS deliveryId,
        o.OrderCreatedAt AS createdAt,
        los.OrderStatus AS status,
        los.OrderUpdatedAt AS updatedAt,
        c.CustName AS customerName,
        rej.RejectionReason as reason,
        rej.RejectionNote as note,
        -- This subquery gets the latest invoice status
        (SELECT s.InvoiceStatus FROM Invoices inv JOIN Invoice_Status s ON inv.InvoiceID = s.InvoiceID WHERE inv.OrderID = o.OrderID ORDER BY s.StatUpdateAt DESC LIMIT 1) as invoiceStatus,
        (
            SELECT op.OrderProcStatus 
            FROM Order_Processing op 
            WHERE op.OrderID = o.OrderID 
            ORDER BY op.OrderProcUpdatedAt DESC 
            LIMIT 1
        ) AS latestProcessStatus
      FROM Orders o
      JOIN Customers c ON o.CustID = c.CustID
      JOIN LatestOrderStatus los ON o.OrderID = los.OrderID
      LEFT JOIN Rejected_Orders rej ON o.OrderID = rej.OrderID
      WHERE o.ShopID = ? AND los.rn = 1
      ORDER BY o.OrderCreatedAt DESC;
      `,
      [shopId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Route for updating an order's status
router.post("/status", async (req, res) => {
  const { orderId, newStatus, reason, note } = req.body;

  if (!orderId || !newStatus) {
    return res
      .status(400)
      .json({ error: "Order ID and new status are required" });
  }

  try {
    // Step 1: Always insert the main status into the Order_Status table
    const newOrderStatId = `OSD${Date.now().toString().slice(-7)}`;
    await db.query(
      "INSERT INTO Order_Status (OrderStatID, OrderID, OrderStatus, OrderUpdatedAt) VALUES (?, ?, ?, NOW())",
      [newOrderStatId, orderId, newStatus]
    );

    // Step 2: If the status is "Rejected", also insert details into the new table
    if (newStatus === "Rejected" && reason) {
      const newRejectedId = `REJ${Date.now().toString().slice(-7)}`;
      await db.query(
        "INSERT INTO Rejected_Orders (RejectedID, OrderID, RejectionReason, RejectionNote, RejectedAt) VALUES (?, ?, ?, ?, NOW())",
        [newRejectedId, orderId, reason, note || null]
      );
    }

    res
      .status(200)
      .json({ success: true, message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// GET a single order's details
router.get("/:orderId", async (req, res) => {
  const { orderId } = req.params;

  try {
    const query = `
      SELECT 
        o.OrderID AS orderId,
        o.OrderCreatedAt AS createdAt,
        c.CustName AS customerName,
        c.CustPhone AS customerPhone,
        (SELECT CustAddress FROM Cust_Addresses WHERE CustID = c.CustID LIMIT 1) AS customerAddress,
        s.SvcName AS serviceName,
        ss.SvcPrice AS servicePrice,
        ld.Kilogram AS weight,
        do.DlvryName AS deliveryType,
        do.DlvryFee AS deliveryFee,
        (
          SELECT os.OrderStatus
          FROM Order_Status os
          WHERE os.OrderID = o.OrderID
          ORDER BY os.OrderUpdatedAt DESC
          LIMIT 1
        ) AS status,
        rej.RejectionReason as reason,
        rej.RejectionNote as note
      FROM Orders o
      LEFT JOIN Customers c ON o.CustID = c.CustID
      LEFT JOIN Services s ON o.SvcID = s.SvcID
      LEFT JOIN Shop_Services ss ON o.ShopID = ss.ShopID AND o.SvcID = ss.SvcID
      LEFT JOIN Laundry_Details ld ON o.LndryDtlID = ld.LndryDtlID
      LEFT JOIN Delivery_Options do ON o.DlvryID = do.DlvryID
      LEFT JOIN Rejected_Orders rej ON o.OrderID = rej.OrderID
      WHERE o.OrderID = ?;
    `;

    const [[orderDetails]] = await db.query(query, [orderId]);

    if (!orderDetails) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(orderDetails);
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ error: "Failed to fetch order details" });
  }
});

// PATCH to update the laundry weight
router.patch("/weight", async (req, res) => {
  const { orderId, newWeight } = req.body;

  if (!orderId || newWeight === undefined) {
    return res
      .status(400)
      .json({ error: "Order ID and new weight are required" });
  }

  try {
    const [result] = await db.query(
      `
      UPDATE Laundry_Details
      SET Kilogram = ?
      WHERE LndryDtlID = (SELECT LndryDtlID FROM Orders WHERE OrderID = ?)
      `,
      [newWeight, orderId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Order not found or no change made" });
    }

    res
      .status(200)
      .json({ success: true, message: "Weight updated successfully" });
  } catch (error) {
    console.error("Error updating weight:", error);
    res.status(500).json({ error: "Failed to update weight" });
  }
});

// POST to insert a new processing status
router.post("/processing-status", async (req, res) => {
  const { orderId, status } = req.body;
  if (!orderId || !status) {
    return res.status(400).json({ error: "Order ID and status are required" });
  }
  try {
    // Step 1: Insert the processing sub-status (e.g., "Washed", "Folded")
    const newProcId = `OP${Date.now().toString().slice(-8)}`;
    await db.query(
      "INSERT INTO Order_Processing (OrderProcID, OrderID, OrderProcStatus, OrderProcUpdatedAt) VALUES (?, ?, ?, NOW())",
      [newProcId, orderId, status]
    );

    // Step 2: If the status is "Out for Delivery", also update the main Order_Status table
    if (status === "Out for Delivery") {
      const newOrderStatId = `OSD${Date.now().toString().slice(-7)}`;
      await db.query(
        "INSERT INTO Order_Status (OrderStatID, OrderID, OrderStatus, OrderUpdatedAt) VALUES (?, ?, 'For Delivery', NOW())",
        [newOrderStatId, orderId]
      );
    }

    res.status(201).json({ success: true, message: "Process status added" });
  } catch (error) {
    console.error("Error adding process status:", error);
    res.status(500).json({ error: "Failed to add status" });
  }
});

// POST to fetch the order summary data
router.post("/summary", async (req, res) => {
  const { shopId, dateRange } = req.body;

  if (!shopId || !dateRange) {
    return res
      .status(400)
      .json({ error: "Shop ID and date range are required" });
  }

  const getDateCondition = (alias) => {
    switch (dateRange) {
      case "Today":
        return `DATE(${alias}.OrderCreatedAt) = CURDATE()`;
      case "This Month":
        return `YEAR(${alias}.OrderCreatedAt) = YEAR(CURDATE()) AND MONTH(${alias}.OrderCreatedAt) = MONTH(CURDATE())`;
      case "This Week":
      default:
        return `YEARWEEK(${alias}.OrderCreatedAt, 1) = YEARWEEK(CURDATE(), 1)`;
    }
  };

  try {
    await db.query("SET SESSION group_concat_max_len = 1000000;");

    const query = `
      WITH LatestInvoiceDetails AS (
        SELECT
          i.OrderID,
          i.PayAmount,
          (SELECT s.InvoiceStatus FROM Invoice_Status s WHERE s.InvoiceID = i.InvoiceID ORDER BY s.StatUpdateAt DESC LIMIT 1) as InvoiceStatus
        FROM Invoices i
      ),
      FilteredOrders AS (
        SELECT 
          o.OrderID,
          o.CustID,
          o.OrderCreatedAt,
          (SELECT os.OrderStatus FROM Order_Status os WHERE os.OrderID = o.OrderID ORDER BY os.OrderUpdatedAt DESC LIMIT 1) as status,
          lid.PayAmount,
          lid.InvoiceStatus
        FROM Orders o
        LEFT JOIN LatestInvoiceDetails lid ON o.OrderID = lid.OrderID
        WHERE o.ShopID = ? AND ${getDateCondition("o")}
      ),
      ChartData AS (
        SELECT
          DATE_FORMAT(OrderCreatedAt, '%a') AS label,
          SUM(PayAmount) AS revenue
        FROM FilteredOrders
        WHERE InvoiceStatus = 'Paid'
        GROUP BY label
        ORDER BY FIELD(label, 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat')
      ),
      RecentOrders AS (
        SELECT
          OrderID AS id,
          (SELECT CustName FROM Customers WHERE CustID = FilteredOrders.CustID) AS customer,
          status,
          PayAmount AS amount,
          InvoiceStatus
        FROM FilteredOrders
        ORDER BY OrderCreatedAt DESC
        LIMIT 10
      )
      SELECT
        (SELECT COUNT(*) FROM FilteredOrders) AS totalOrders,
        (SELECT COUNT(*) FROM FilteredOrders WHERE status = 'Completed') AS completedOrders,
        (SELECT COUNT(*) FROM FilteredOrders WHERE status NOT IN ('Completed', 'Rejected', 'Cancelled')) AS pendingOrders,
        (SELECT SUM(CASE WHEN InvoiceStatus = 'Paid' THEN PayAmount ELSE 0 END) FROM FilteredOrders) AS totalRevenue,
        (SELECT CONCAT('[', GROUP_CONCAT(JSON_OBJECT('label', label, 'revenue', revenue)), ']') FROM ChartData) AS chartData,
        (SELECT CONCAT('[', GROUP_CONCAT(JSON_OBJECT('id', id, 'customer', customer, 'status', status, 'amount', amount, 'invoiceStatus', InvoiceStatus)), ']') FROM RecentOrders) AS recentOrders;
    `;

    const [[results]] = await db.query(query, [shopId]);
    
    results.chartData = results.chartData ? JSON.parse(results.chartData) : [];
    results.recentOrders = results.recentOrders ? JSON.parse(results.recentOrders) : [];

    res.json(results);
  } catch (error) {
    console.error("Error fetching order summary:", error);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});


// POST /api/orders/dashboard-summary -- UPDATED ROUTE
router.post("/dashboard-summary", async (req, res) => {
  const { shopId, period } = req.body; 

  if (!shopId || !period) {
    return res.status(400).json({ error: "Shop ID and period are required" });
  }

  // This section uses the 'period' variable to build SQL conditions
  let groupBy, dateFormat, dateCondition;
  switch (period) {
    case 'Monthly':
      groupBy = `DATE_FORMAT(o.OrderCreatedAt, '%Y-%m')`;
      dateFormat = `'%b'`; // e.g., 'Oct'
      dateCondition = `YEAR(o.OrderCreatedAt) = YEAR(CURDATE()) AND MONTH(o.OrderCreatedAt) = MONTH(CURDATE())`;
      break;
    case 'Yearly':
      groupBy = `YEAR(o.OrderCreatedAt)`;
      dateFormat = `'%Y'`; // e.g., '2025'
      dateCondition = `YEAR(o.OrderCreatedAt) = YEAR(CURDATE())`;
      break;
    case 'Weekly':
    default:
      groupBy = `DAYOFWEEK(o.OrderCreatedAt)`;
      dateFormat = `'%a'`; // e.g., 'Thu'
      dateCondition = `YEARWEEK(o.OrderCreatedAt, 1) = YEARWEEK(CURDATE(), 1)`;
  }

  try {
    await db.query("SET SESSION group_concat_max_len = 1000000;");

    // The query now includes the logic for 'newCustomers'
    const query = `
      SELECT
        -- Calculate Total Orders for the period
        (SELECT COUNT(*) FROM Orders o WHERE o.ShopID = ? AND ${dateCondition}) AS totalOrders,
        
        -- Calculate Total Revenue for the period
        (SELECT SUM(i.PayAmount) 
         FROM Orders o 
         JOIN Invoices i ON o.OrderID = i.OrderID
         WHERE o.ShopID = ? AND ${dateCondition} AND (SELECT s.InvoiceStatus FROM Invoice_Status s WHERE s.InvoiceID = i.InvoiceID ORDER BY s.StatUpdateAt DESC LIMIT 1) = 'Paid'
        ) AS totalRevenue,

        -- ✅ NEW: Calculate New Customers for the period
        (
            SELECT COUNT(CustID)
            FROM (
                -- First, find the date of the very first order for each customer
                SELECT CustID, MIN(OrderCreatedAt) as first_order_date
                FROM Orders
                WHERE ShopID = ?
                GROUP BY CustID
            ) AS customer_first_orders
            -- Then, count how many of those first orders happened in the current period
            WHERE YEARWEEK(first_order_date, 1) = YEARWEEK(CURDATE(), 1) -- This condition needs to match the period
        ) AS newCustomers,

        -- Aggregate chart data into a JSON string
        (
          SELECT CONCAT('[', GROUP_CONCAT(JSON_OBJECT('label', label, 'value', revenue)), ']')
          FROM (
            SELECT
              DATE_FORMAT(o.OrderCreatedAt, ${dateFormat}) AS label,
              SUM(i.PayAmount) AS revenue
            FROM Orders o
            JOIN Invoices i ON o.OrderID = i.OrderID
            WHERE o.ShopID = ? AND ${dateCondition} AND (SELECT s.InvoiceStatus FROM Invoice_Status s WHERE s.InvoiceID = i.InvoiceID ORDER BY s.StatUpdateAt DESC LIMIT 1) = 'Paid'
            GROUP BY ${groupBy}, label
            ORDER BY o.OrderCreatedAt
          ) AS ChartData
        ) AS chartData;
    `;
    
    // Note: We've added more placeholders `?`, so we must add `shopId` for each one.
    const [[results]] = await db.query(query, [shopId, shopId, shopId, shopId]);
    
    const chartDataArray = results.chartData ? JSON.parse(results.chartData) : [];

    res.json({
        totalOrders: results.totalOrders || 0,
        totalRevenue: results.totalRevenue || 0,
        newCustomers: results.newCustomers || 0, // Add newCustomers to the response
        chartData: chartDataArray,
    });

  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    res.status(500).json({ error: "Failed to fetch dashboard summary" });
  }
});


// ✅ NEW ROUTE for Order Type Breakdown
router.post("/report/order-types", async (req, res) => {
  const { shopId, period } = req.body; // Assuming you'll filter by period later

  if (!shopId) {
    return res.status(400).json({ error: "Shop ID is required" });
  }

  try {
    const query = `
      SELECT 
        s.SvcName AS label,
        COUNT(o.OrderID) AS count
      FROM Orders o
      JOIN Services s ON o.SvcID = s.SvcID
      WHERE o.ShopID = ?
      GROUP BY s.SvcName
      ORDER BY count DESC;
    `;
    const [rows] = await db.query(query, [shopId]);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching order type breakdown:", error);
    res.status(500).json({ error: "Failed to fetch order type breakdown" });
  }
});

// ✅ NEW ROUTE for Top 5 Employees by Revenue
router.post("/report/top-employees", async (req, res) => {
  const { shopId, period } = req.body; // Assuming you'll filter by period later

  if (!shopId) {
    return res.status(400).json({ error: "Shop ID is required" });
  }
  
  try {
    // Note: This query assumes you have an 'employees' table and a way to link an order/invoice to an employee.
    // This is a hypothetical structure. You MUST adapt the JOIN condition to your actual database schema.
    const query = `
      SELECT
        s.StaffName as name,
        SUM(i.PayAmount) AS revenue
      FROM Invoices i
      JOIN Orders o ON i.OrderID = o.OrderID
      JOIN Staffs s ON o.StaffID = s.StaffID 
      WHERE o.ShopID = ? AND (SELECT s.InvoiceStatus FROM Invoice_Status s WHERE s.InvoiceID = i.InvoiceID ORDER BY s.StatUpdateAt DESC LIMIT 1) = 'Paid'
      GROUP BY s.StaffID, s.StaffName
      ORDER BY revenue DESC
      LIMIT 5;
    `;
    const [rows] = await db.query(query, [shopId]);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching top employees:", error);
    res.status(500).json({ error: "Failed to fetch top employees" });
  }
});


// ✅ UPDATED ROUTE: GET /api/orders/list/:shopId with sorting functionality
router.get("/list/:shopId", async (req, res) => {
    const { shopId } = req.params;
    const { sortBy = 'OrderCreatedAt', sortOrder = 'DESC' } = req.query; // Defaults to newest first

    // Whitelist allowed columns for sorting to prevent SQL injection
    const allowedSortColumns = {
        SvcName: 's.SvcName',
        OrderStatus: 'OrderStatus',
        OrderCreatedAt: 'o.OrderCreatedAt'
    };
    const sortColumn = allowedSortColumns[sortBy] || 'o.OrderCreatedAt'; // Default if invalid column is passed

    // Whitelist allowed sort orders
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    try {
        const [orders] = await db.query(
            `SELECT 
                o.OrderID,
                o.CustID,
                s.SvcName,
                i.PayAmount,
                (
                    SELECT os.OrderStatus 
                    FROM Order_Status os 
                    WHERE os.OrderID = o.OrderID 
                    ORDER BY os.OrderUpdatedAt DESC 
                    LIMIT 1
                ) AS OrderStatus,
                o.OrderCreatedAt
            FROM Orders o
            LEFT JOIN Services s ON o.SvcID = s.SvcID
            LEFT JOIN Invoices i ON o.OrderID = i.OrderID
            WHERE o.ShopID = ?
            ORDER BY ${sortColumn} ${sortDirection}`, // Dynamic sorting
            [shopId]
        );
        res.json(orders);
    } catch (error) {
        console.error("Error fetching simple order list:", error);
        res.status(500).json({ error: "Server error while fetching orders." });
    }
});

router.get("/sales/:shopId", async (req, res) => {
    const { shopId } = req.params;
    const { period = 'Weekly' } = req.query; // Default to weekly

    let dateCondition = `YEARWEEK(o.OrderCreatedAt, 1) = YEARWEEK(CURDATE(), 1)`; // Default for Weekly
    if (period === 'Monthly') {
        dateCondition = `YEAR(o.OrderCreatedAt) = YEAR(CURDATE()) AND MONTH(o.OrderCreatedAt) = MONTH(CURDATE())`;
    } else if (period === 'Yearly') {
        dateCondition = `YEAR(o.OrderCreatedAt) = YEAR(CURDATE())`;
    }
    
    try {
        const query = `
            -- This CTE gets the list of paid transactions for the period
            WITH PaidTransactions AS (
                SELECT 
                    o.OrderID,
                    o.OrderCreatedAt,
                    i.PayAmount
                FROM Orders o
                JOIN Invoices i ON o.OrderID = i.OrderID
                WHERE 
                    o.ShopID = ? 
                    AND ${dateCondition} 
                    AND (SELECT s.InvoiceStatus FROM Invoice_Status s WHERE s.InvoiceID = i.InvoiceID ORDER BY s.StatUpdateAt DESC LIMIT 1) = 'Paid'
            )
            -- Main query to get both summary and the list
            SELECT
                -- Summary Metrics
                (SELECT COUNT(*) FROM PaidTransactions) AS totalOrders,
                (SELECT SUM(PayAmount) FROM PaidTransactions) AS totalSales,
                
                -- Transaction List (as a JSON array string)
                (SELECT CONCAT('[', GROUP_CONCAT(
                    JSON_OBJECT(
                        'OrderID', OrderID,
                        'OrderCreatedAt', OrderCreatedAt,
                        'PayAmount', PayAmount
                    ) ORDER BY OrderCreatedAt DESC
                ), ']') FROM PaidTransactions) AS transactions;
        `;

        const [[results]] = await db.query(query, [shopId]);
        
        // Parse the JSON string into an actual array
        const transactionsArray = results.transactions ? JSON.parse(results.transactions) : [];

        res.json({
            summary: {
                totalSales: results.totalSales || 0,
                totalOrders: results.totalOrders || 0,
            },
            transactions: transactionsArray
        });

    } catch (error) {
        console.error("Error fetching sales data:", error);
        res.status(500).json({ error: "Server error while fetching sales data." });
    }
});


// ✅ UPDATED ROUTE: GET /api/orders/overview/:shopId
// Now includes date filtering based on a 'period' query parameter.
router.get("/overview/:shopId", async (req, res) => {
    const { shopId } = req.params;
    const { 
        sortBy = 'OrderCreatedAt', 
        sortOrder = 'DESC', 
        period = 'Today', // Default to 'Today'
        startDate, 
        endDate 
    } = req.query;

    // --- Date Filtering Logic ---
    let dateCondition = `DATE(o.OrderCreatedAt) = CURDATE()`; // Default for 'Today'
    if (startDate && endDate) {
        // Use custom range if provided
        dateCondition = `DATE(o.OrderCreatedAt) BETWEEN ? AND ?`;
    } else {
        switch (period) {
            case 'Weekly':
                dateCondition = `YEARWEEK(o.OrderCreatedAt, 1) = YEARWEEK(CURDATE(), 1)`;
                break;
            case 'Monthly':
                dateCondition = `YEAR(o.OrderCreatedAt) = YEAR(CURDATE()) AND MONTH(o.OrderCreatedAt) = MONTH(CURDATE())`;
                break;
            case 'Yearly':
                dateCondition = `YEAR(o.OrderCreatedAt) = YEAR(CURDATE())`;
                break;
        }
    }
    
    const dateParams = (startDate && endDate) ? [startDate, endDate] : [];

    // --- Sorting Logic ---
    const allowedSortColumns = { SvcName: 's.SvcName', OrderStatus: 'OrderStatus', OrderCreatedAt: 'o.OrderCreatedAt' };
    const sortColumn = allowedSortColumns[sortBy] || 'o.OrderCreatedAt';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const connection = await db.getConnection();
    try {
        // Query 1: Get the summary counts with the date filter
        const [summaryRows] = await connection.query(
            `WITH LatestOrderStatus AS (
                SELECT 
                    o.OrderID,
                    (SELECT os.OrderStatus FROM Order_Status os WHERE os.OrderID = o.OrderID ORDER BY os.OrderUpdatedAt DESC LIMIT 1) AS LatestStatus
                FROM Orders o
                WHERE o.ShopID = ? AND ${dateCondition}
            )
            SELECT LatestStatus, COUNT(OrderID) as count 
            FROM LatestOrderStatus 
            GROUP BY LatestStatus;`,
            [shopId, ...dateParams]
        );

        const summary = { pending: 0, processing: 0, forDelivery: 0, completed: 0, rejected: 0 };
        summaryRows.forEach(row => {
            if (row.LatestStatus === 'Pending') summary.pending = row.count;
            else if (row.LatestStatus === 'Processing') summary.processing = row.count;
            else if (row.LatestStatus === 'For Delivery') summary.forDelivery = row.count;
            else if (row.LatestStatus === 'Completed') summary.completed = row.count;
            else if (row.LatestStatus === 'Rejected') summary.rejected = row.count;
        });

        // Query 2: Get the detailed list of orders with the date filter
        const [orders] = await connection.query(
            `SELECT 
                o.OrderID, o.CustID, s.SvcName, i.PayAmount,
                (SELECT os.OrderStatus FROM Order_Status os WHERE os.OrderID = o.OrderID ORDER BY os.OrderUpdatedAt DESC LIMIT 1) AS OrderStatus,
                o.OrderCreatedAt
            FROM Orders o
            LEFT JOIN Services s ON o.SvcID = s.SvcID
            LEFT JOIN Invoices i ON o.OrderID = i.OrderID
            WHERE o.ShopID = ? AND ${dateCondition}
            ORDER BY ${sortColumn} ${sortDirection}`,
            [shopId, ...dateParams]
        );

        res.json({ summary, orders });

    } catch (error) {
        console.error("Error fetching order overview:", error);
        res.status(500).json({ error: "Server error while fetching order overview." });
    } finally {
        connection.release();
    }
});


export default router;