// routes/orders.js
import express from "express";
import db from "../db.js";
// 💡 Import the logger utility
import { logUserActivity } from '../utils/logger.js'; 

const router = express.Router();

// =================================================================
// Helper Functions
// =================================================================

// 💡 REFACTORED: Use a more robust, non-timestamp-dependent ID for safety
function generateID(prefix) {
    const random = Math.random().toString(36).substring(2, 9).toUpperCase();
    const hash = (Math.random() * 10000000000000000).toString(36).slice(0, 5).toUpperCase();
    return `${prefix}${random}${hash}`;
}

// Helper to determine date condition for dashboard queries
const getDateCondition = (period, alias) => {
    switch (period) {
        case "Today":
            return `DATE(${alias}.OrderCreatedAt) = CURDATE()`;
        case "This Month":
            return `YEAR(${alias}.OrderCreatedAt) = YEAR(CURDATE()) AND MONTH(${alias}.OrderCreatedAt) = MONTH(CURDATE())`;
        case "This Week":
        default:
            return `YEARWEEK(${alias}.OrderCreatedAt, 1) = YEARWEEK(CURDATE(), 1)`;
    }
};

// =================================================================
// API Routes: Order Creation
// =================================================================

// Creates a new order along with related details, status, and invoice records.
router.post("/", async (req, res) => {
    // --- 💡 LOG: Request received and payload content ---
    console.log("--- START ORDER CREATION PROCESS ---");
    console.log("Payload received:", req.body);
    
    const {
        CustID, 
        ShopID, 
        SvcID,
        deliveryId, 
        weight, 
        instructions, 
        fabrics, 
        addons 
    } = req.body;

    // Basic validation
    if (!CustID || !ShopID || !SvcID || !deliveryId || weight === undefined || !fabrics || fabrics.length === 0) {
        console.error("Validation failed: Missing required fields.");
        return res.status(400).json({ success: false, message: "Missing required fields (CustID, ShopID, SvcID, deliveryId, weight, fabrics)." });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        console.log("Transaction started successfully.");

        // 🔑 NEW LOGIC: AUTOMATIC STAFF SELECTION
        console.log("Step 0: Attempting to assign staff...");
        const [staffs] = await connection.query(
            `SELECT StaffID
            FROM Staffs
            WHERE ShopID = ? AND StaffRole = 'Cashier'
            ORDER BY StaffID ASC
            LIMIT 1`,
            [ShopID]
        );

        let assignedStaffID = null;
        if (staffs.length > 0) {
            assignedStaffID = staffs[0].StaffID;
            console.log(`Staff assigned: ${assignedStaffID}`);
        } else {
            console.warn(`No cashier staff found for ShopID ${ShopID}. Order will be unassigned (StaffID is NULL).`);
        }
        // END NEW LOGIC

        // 1. Insert into Laundry_Details
        const newLndryDtlID = generateID('LD');
        console.log(`Step 1: Inserting Laundry_Details with ID ${newLndryDtlID}`);
        await connection.query(
            "INSERT INTO Laundry_Details (LndryDtlID, Kilogram, SpecialInstr) VALUES (?, ?, ?)",
            [newLndryDtlID, weight, instructions || null]
        );

        // 2. Insert fabric types
        if (fabrics && fabrics.length > 0) {
            console.log(`Step 2: Inserting ${fabrics.length} Fabric types.`);
            const fabricPlaceholders = fabrics.map(() => `(?, ?)`).join(', ');
            const fabricValues = fabrics.flatMap(fabTypeID => [newLndryDtlID, fabTypeID]);
            await connection.query(
                `INSERT INTO Order_Fabrics (LndryDtlID, FabTypeID) VALUES ${fabricPlaceholders}`,
                fabricValues
            );
        } else {
            console.log("Step 2: No fabrics to insert.");
        }

        // 3. Insert addons
        if (addons && Array.isArray(addons) && addons.length > 0) {
            console.log(`Step 3: Inserting ${addons.length} Add-Ons.`);
            const addonPlaceholders = addons.map(() => `(?, ?)`).join(', ');
            const addonValues = addons.flatMap(addonId => [newLndryDtlID, addonId]);
            await connection.query(
                `INSERT INTO Order_AddOns (LndryDtlID, AddOnID) VALUES ${addonPlaceholders}`,
                addonValues
            );
        } else {
            console.log("Step 3: No Add-Ons to insert.");
        }

        // 4. Generate the main OrderID and insert into Orders table
        const newOrderID = generateID('O');
        console.log(`Step 4: Inserting main Order with ID ${newOrderID}.`);
        await connection.query(
            "INSERT INTO Orders (OrderID, CustID, ShopID, SvcID, StaffID, LndryDtlID, DlvryID, OrderCreatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
            [newOrderID, CustID, ShopID, SvcID, assignedStaffID, newLndryDtlID, deliveryId]
        );

        // 5. Set initial status to 'Pending' in Order_Status
        const newOrderStatId = generateID('OSD');
        console.log(`Step 5: Inserting initial Order_Status: 'Pending'`);
        await connection.query(
            "INSERT INTO Order_Status (OrderStatID, OrderID, OrderStatus, OrderUpdatedAt) VALUES (?, ?, 'Pending', NOW())",
            [newOrderStatId, newOrderID]
        );

        // 6. Create an initial Invoice record
        const newInvoiceID = generateID('INV');
        console.log(`Step 6: Inserting initial Invoice ID ${newInvoiceID} (Amount: 0.00).`);
        await connection.query(
            "INSERT INTO Invoices (InvoiceID, OrderID, DlvryFee, PayAmount) VALUES (?, ?, 0.00, 0.00)",
            [newInvoiceID, newOrderID] 
        );

        // 7. Set initial Invoice_Status
        const newInvoiceStatID = generateID('IS');
        console.log(`Step 7: Inserting initial Invoice_Status: 'Draft'`);
        await connection.query(
            "INSERT INTO Invoice_Status (InvoiceStatusID, InvoiceID, InvoiceStatus, StatUpdateAt) VALUES (?, ?, 'Draft', NOW())",
            [newInvoiceStatID, newInvoiceID]
        );
        
        console.log("All insertions complete. Committing transaction...");
        
        // 💡 LOG: Successful Order Creation... (omitted for brevity)
        await logUserActivity(CustID, 'Customer', 'Create Order', `New order created: ${newOrderID} assigned to: ${assignedStaffID}`);


        await connection.commit();
        console.log("Transaction committed successfully. Sending response.");

        res.status(201).json({ 
            success: true, 
            message: "Order created successfully with initial details.", 
            orderId: newOrderID 
        });

    } catch (error) {
        console.error("--- TRANSACTION FAILED. ROLLING BACK. ---");
        await connection.rollback();
        console.error("❌ Create order error:", error);
        res.status(500).json({ success: false, message: "Failed to create order." });
    } finally {
        connection.release();
        console.log("Database connection released. --- END ORDER CREATION PROCESS ---");
    }
});

// =================================================================
// API Routes: Order Fetching (Shop & Customer)
// =================================================================

// GET /api/orders/customer/:customerId
// ✅ NEW ROUTE: Fetch all orders for a specific customer.
router.get("/customer/:customerId", async (req, res) => {
    const { customerId } = req.params;
    try {
        const query = `
            WITH LatestOrderStatus AS (
                SELECT 
                    OrderID, OrderStatus, OrderUpdatedAt,
                    ROW_NUMBER() OVER (PARTITION BY OrderID ORDER BY OrderUpdatedAt DESC) as rn
                FROM Order_Status
            )
            SELECT 
                o.OrderID AS id,
                o.OrderCreatedAt AS createdAt,
                ls.ShopName AS shopName,
                s.SvcName AS serviceName,
                los.OrderStatus AS status,
                i.PayAmount AS totalAmount
            FROM Orders o
            JOIN LatestOrderStatus los ON o.OrderID = los.OrderID
            JOIN Laundry_Shops ls ON o.ShopID = ls.ShopID
            JOIN Services s ON o.SvcID = s.SvcID
            LEFT JOIN Invoices i ON o.OrderID = i.OrderID
            WHERE o.CustID = ? AND los.rn = 1
            ORDER BY o.OrderCreatedAt DESC;
        `;
        const [rows] = await db.query(query, [customerId]);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching customer orders:", error);
        res.status(500).json({ error: "Failed to fetch customer orders" });
    }
});


// GET /api/orders/shop/:shopId
// Fetches all orders for a specific shop, showing the latest status.
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
                s.SvcName AS serviceName,
                rej.RejectionReason as reason,
                rej.RejectionNote as note,
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
            JOIN Services s ON o.SvcID = s.SvcID
            JOIN LatestOrderStatus los ON o.OrderID = los.OrderID
            LEFT JOIN Rejected_Orders rej ON o.OrderID = rej.OrderID
            WHERE o.ShopID = ? AND los.rn = 1
            ORDER BY o.OrderCreatedAt DESC;
            `,
            [shopId]
        );
        res.json(rows);
    } catch (error) {
        console.error("Error fetching shop orders:", error);
        res.status(500).json({ error: "Failed to fetch shop orders" });
    }
});

// GET /api/orders/:orderId
// Fetches a single order's details, including fabrics and addons.
router.get("/:orderId", async (req, res) => {
    const { orderId } = req.params;
    const connection = await db.getConnection();
    try {
        const orderQuery = `
            SELECT 
                o.OrderID AS orderId,
                o.OrderCreatedAt AS createdAt,
                c.CustName AS customerName,
                c.CustPhone AS customerPhone,
                ls.ShopName AS shopName,
                (SELECT CustAddress FROM Cust_Addresses WHERE CustID = c.CustID LIMIT 1) AS customerAddress,
                s.SvcName AS serviceName,
                ss.SvcPrice AS servicePrice,
                ld.Kilogram AS initialWeight,
                ld.FinalWeight AS finalWeight,
                ld.SpecialInstr AS instructions,
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
            LEFT JOIN Laundry_Shops ls ON o.ShopID = ls.ShopID
            LEFT JOIN Services s ON o.SvcID = s.SvcID
            LEFT JOIN Shop_Services ss ON o.ShopID = ss.ShopID AND o.SvcID = ss.SvcID
            LEFT JOIN Laundry_Details ld ON o.LndryDtlID = ld.LndryDtlID
            LEFT JOIN Delivery_Options do ON o.DlvryID = do.DlvryID
            LEFT JOIN Rejected_Orders rej ON o.OrderID = rej.OrderID
            WHERE o.OrderID = ?;
        `;
        const [[orderDetails]] = await connection.query(orderQuery, [orderId]);

        if (!orderDetails) {
            return res.status(404).json({ error: "Order not found" });
        }

        // --- Fetch Fabrics ---
        const [fabrics] = await connection.query(
            `SELECT ft.FabTypeName FROM Order_Fabrics ofb 
             JOIN Fabric_Types ft ON ofb.FabTypeID = ft.FabTypeID
             WHERE ofb.LndryDtlID = (SELECT LndryDtlID FROM Orders WHERE OrderID = ?)`,
            [orderId]
        );

        // --- Fetch Addons ---
        const [addons] = await connection.query(
            `SELECT a.AddOnName FROM Order_AddOns oao 
             JOIN AddOns a ON oao.AddOnID = a.AddOnID
             WHERE oao.LndryDtlID = (SELECT LndryDtlID FROM Orders WHERE OrderID = ?)`,
            [orderId]
        );

        res.json({
            ...orderDetails,
            fabrics: fabrics.map(f => f.FabTypeName),
            addons: addons.map(a => a.AddOnName)
        });
    } catch (error) {
        console.error("Error fetching order details:", error);
        res.status(500).json({ error: "Failed to fetch order details" });
    } finally {
        connection.release();
    }
});

// =================================================================
// API Routes: Status & Details Update
// =================================================================

// POST /api/orders/status
// Route for updating an order's main status.
router.post("/status", async (req, res) => {
    const { orderId, newStatus, reason, note, userId, userRole } = req.body;

    if (!orderId || !newStatus) {
        return res
            .status(400)
            .json({ error: "Order ID and new status are required" });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        // 1. Always insert the main status into the Order_Status table
        const newOrderStatId = generateID('OSD');
        await connection.query(
            "INSERT INTO Order_Status (OrderStatID, OrderID, OrderStatus, OrderUpdatedAt) VALUES (?, ?, ?, NOW())",
            [newOrderStatId, orderId, newStatus]
        );

        // 2. If the status is "Rejected" or "Cancelled", also insert details into the relevant table
        if (newStatus === "Rejected" && reason) {
            const newRejectedId = generateID('REJ');
            await connection.query(
                "INSERT INTO Rejected_Orders (RejectedID, OrderID, RejectionReason, RejectionNote, RejectedAt) VALUES (?, ?, ?, ?, NOW())",
                [newRejectedId, orderId, reason, note || null]
            );
        }
        
        // 💡 LOG: Order Status Change
        await logUserActivity(userId, userRole, 'Update Order Status', `Order ${orderId} status changed to: ${newStatus}`);

        await connection.commit();

        res
            .status(200)
            .json({ success: true, message: "Order status updated successfully" });
    } catch (error) {
        await connection.rollback();
        console.error("Error updating order status:", error);
        res.status(500).json({ error: "Failed to update order status" });
    } finally {
        connection.release();
    }
});

// PATCH /api/orders/weight
// PATCH to update the initial/final laundry weight.
router.patch("/weight", async (req, res) => {
    const { orderId, newWeight, isFinal = false, userId, userRole } = req.body;

    if (!orderId || newWeight === undefined) {
        return res
            .status(400)
            .json({ error: "Order ID and new weight are required" });
    }

    const connection = await db.getConnection();
    try {
        const weightColumn = isFinal ? 'FinalWeight' : 'Kilogram';
        
        const [result] = await connection.query(
            `
            UPDATE Laundry_Details
            SET ${weightColumn} = ?
            WHERE LndryDtlID = (SELECT LndryDtlID FROM Orders WHERE OrderID = ?)
            `,
            [newWeight, orderId]
        );

        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ error: "Order not found or no change made" });
        }
        
        // 💡 LOG: Weight Update
        await logUserActivity(userId, userRole, 'Update Order Details', `Order ${orderId}: ${weightColumn} updated to ${newWeight}`);

        res
            .status(200)
            .json({ success: true, message: "Weight updated successfully" });
    } catch (error) {
        console.error("Error updating weight:", error);
        res.status(500).json({ error: "Failed to update weight" });
    } finally {
        connection.release();
    }
});


// POST /api/orders/processing-status
// POST to insert a new processing status (sub-status).
router.post("/processing-status", async (req, res) => {
    const { orderId, status, userId, userRole } = req.body;
    if (!orderId || !status) {
        return res.status(400).json({ error: "Order ID and status are required" });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        // 1. Insert the processing sub-status (e.g., "Washed", "Folded")
        const newProcId = generateID('OP');
        await connection.query(
            "INSERT INTO Order_Processing (OrderProcID, OrderID, OrderProcStatus, OrderProcUpdatedAt) VALUES (?, ?, ?, NOW())",
            [newProcId, orderId, status]
        );

        // 2. If the status requires a main status update, update Order_Status table
        if (status === "Out for Delivery") {
            const newOrderStatId = generateID('OSD');
            await connection.query(
                "INSERT INTO Order_Status (OrderStatID, OrderID, OrderStatus, OrderUpdatedAt) VALUES (?, ?, 'For Delivery', NOW())",
                [newOrderStatId, orderId]
            );
        } else if (status === "Ready for Pickup") {
             const newOrderStatId = generateID('OSD');
            await connection.query(
                "INSERT INTO Order_Status (OrderStatID, OrderID, OrderStatus, OrderUpdatedAt) VALUES (?, ?, 'Ready for Pickup', NOW())",
                [newOrderStatId, orderId]
            );
        }
        
        // 💡 LOG: Processing Status Change
        await logUserActivity(userId, userRole, 'Update Order Processing', `Order ${orderId} processing step: ${status}`);

        await connection.commit();

        res.status(201).json({ success: true, message: "Process status added" });
    } catch (error) {
        await connection.rollback();
        console.error("Error adding process status:", error);
        res.status(500).json({ error: "Failed to add status" });
    } finally {
        connection.release();
    }
});

// =================================================================
// API Routes: Reporting & Dashboard
// =================================================================

// Inside orders.js (assuming you're using express and mysql2/promise)

router.get("/overview/:shopId", async (req, res) => {
    const { shopId } = req.params;
    const { 
        period, 
        startDate, 
        endDate, 
        sortBy = 'OrderCreatedAt', 
        sortOrder = 'DESC' 
    } = req.query;

    if (!shopId) {
        return res.status(400).json({ error: "Shop ID is required" });
    }

    let dateCondition = "";
    const queryParams = [shopId]; // Initialize with shopId for the summary/order list

    // --- 1. Dynamic Date Filtering Logic ---
    if (startDate && endDate) {
        dateCondition = `o.OrderCreatedAt BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)`; // Include the end date
        queryParams.push(startDate, endDate);
    } else {
        // Handle period filtering (Today, Weekly, Monthly, Yearly)
        switch (period) {
            case 'Today':
                dateCondition = `DATE(o.OrderCreatedAt) = CURDATE()`;
                break;
            case 'Weekly':
                // Assuming MySQL's default week start (Sunday=0 or Monday=1). Adjust '1' if needed.
                dateCondition = `YEARWEEK(o.OrderCreatedAt, 1) = YEARWEEK(CURDATE(), 1)`;
                break;
            case 'Monthly':
                dateCondition = `YEAR(o.OrderCreatedAt) = YEAR(CURDATE()) AND MONTH(o.OrderCreatedAt) = MONTH(CURDATE())`;
                break;
            case 'Yearly':
                dateCondition = `YEAR(o.OrderCreatedAt) = YEAR(CURDATE())`;
                break;
            default:
                // Default to showing all time if no period/dates are specified
                dateCondition = `1=1`;
        }
    }
    
    // --- 2. SQL Queries (Combined for efficiency) ---
    // The query needs to be structured to return two result sets: summary and orders.
    // However, since we're using mysql2, it's safer and cleaner to execute two separate queries.
    try {
        // Query 1: Order List (The main data for the table)
        const ordersQuery = `
            SELECT 
                o.OrderID,
                o.CustID,
                s.SvcName,
                i.PayAmount,
                (SELECT os.OrderStatus FROM Order_Status os WHERE os.OrderID = o.OrderID ORDER BY os.OrderUpdatedAt DESC LIMIT 1) AS OrderStatus,
                o.OrderCreatedAt
            FROM 
                Orders o
            LEFT JOIN 
                Services s ON o.SvcID = s.SvcID
            LEFT JOIN
                Invoices i ON o.OrderID = i.OrderID
            WHERE 
                o.ShopID = ? AND ${dateCondition}
            ORDER BY 
                ${sortBy} ${sortOrder}
        `;
        // The first shopId is used here. 
        // We need to duplicate the date parameters for the order list query.
        const orderListParams = [shopId];
        if (startDate && endDate) {
             orderListParams.push(startDate, endDate);
        }

        const [orders] = await db.query(ordersQuery, orderListParams);


        // Query 2: Status Summary (KPI Counts)
        const summaryQuery = `
            SELECT
                SUM(CASE WHEN (SELECT os.OrderStatus FROM Order_Status os WHERE os.OrderID = o.OrderID ORDER BY os.OrderUpdatedAt DESC LIMIT 1) = 'Pending' THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN (SELECT os.OrderStatus FROM Order_Status os WHERE os.OrderID = o.OrderID ORDER BY os.OrderUpdatedAt DESC LIMIT 1) = 'Processing' THEN 1 ELSE 0 END) AS processing,
                SUM(CASE WHEN (SELECT os.OrderStatus FROM Order_Status os WHERE os.OrderID = o.OrderID ORDER BY os.OrderUpdatedAt DESC LIMIT 1) = 'For Delivery' THEN 1 ELSE 0 END) AS forDelivery,
                SUM(CASE WHEN (SELECT os.OrderStatus FROM Order_Status os WHERE os.OrderID = o.OrderID ORDER BY os.OrderUpdatedAt DESC LIMIT 1) = 'Completed' THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN (SELECT os.OrderStatus FROM Order_Status os WHERE os.OrderID = o.OrderID ORDER BY os.OrderUpdatedAt DESC LIMIT 1) = 'Rejected' THEN 1 ELSE 0 END) AS rejected
            FROM 
                Orders o
            WHERE 
                o.ShopID = ? AND ${dateCondition}
        `;
        // The shopId and date parameters need to be repeated for the summary query.
        const summaryParams = [shopId];
        if (startDate && endDate) {
            summaryParams.push(startDate, endDate);
        }

        const [summaryResults] = await db.query(summaryQuery, summaryParams);
        const summary = summaryResults[0] || {};
        
        // --- 3. Return Final Structure ---
        res.json({
            summary: summary,
            orders: orders
        });

    } catch (error) {
        console.error("Error fetching order overview:", error);
        res.status(500).json({ error: "Failed to fetch order overview" });
    }
});

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


// POST /api/orders/dashboard-summary
// Fetches key metrics (Orders, Revenue, New Customers) and chart data.
router.post("/dashboard-summary", async (req, res) => {
    const { shopId, period = 'Weekly' } = req.body; 

    if (!shopId) {
        return res.status(400).json({ error: "Shop ID is required" });
    }

    let groupBy, dateFormat, dateCondition;
    // ... (omitted switch block for brevity, it is correct)
    switch (period) {
        case 'Monthly':
            groupBy = `DATE_FORMAT(o.OrderCreatedAt, '%Y-%m')`;
            dateFormat = `'%b'`;
            dateCondition = `YEAR(o.OrderCreatedAt) = YEAR(CURDATE()) AND MONTH(o.OrderCreatedAt) = MONTH(CURDATE())`;
            break;
        case 'Yearly':
            groupBy = `YEAR(o.OrderCreatedAt)`;
            dateFormat = `'%Y'`;
            dateCondition = `YEAR(o.OrderCreatedAt) = YEAR(CURDATE())`;
            break;
        case 'Weekly':
        default:
            groupBy = `DAYOFWEEK(o.OrderCreatedAt)`;
            dateFormat = `'%a'`;
            dateCondition = `YEARWEEK(o.OrderCreatedAt, 1) = YEARWEEK(CURDATE(), 1)`;
    }


    let newCustomerDateCondition;
    // ... (omitted switch block for brevity, it is correct)
    switch (period) {
        case 'Monthly':
            newCustomerDateCondition = `YEAR(first_order_date) = YEAR(CURDATE()) AND MONTH(first_order_date) = MONTH(CURDATE())`;
            break;
        case 'Yearly':
            newCustomerDateCondition = `YEAR(first_order_date) = YEAR(CURDATE())`;
            break;
        case 'Weekly':
        default:
            newCustomerDateCondition = `YEARWEEK(first_order_date, 1) = YEARWEEK(CURDATE(), 1)`;
    }


    try {
        await db.query("SET SESSION group_concat_max_len = 1000000;");

        const query = `
            SELECT
                -- 1. Calculate Total Orders for the period (Placeholder: 1)
                (SELECT COUNT(*) FROM Orders o WHERE o.ShopID = ? AND ${dateCondition}) AS totalOrders,
                
                -- 2. Calculate Total Revenue for the period (Placeholder: 2)
                (SELECT SUM(i.PayAmount) 
                    FROM Orders o 
                    JOIN Invoices i ON o.OrderID = i.OrderID
                    WHERE o.ShopID = ? AND ${dateCondition} AND (SELECT s.InvoiceStatus FROM Invoice_Status s WHERE s.InvoiceID = i.InvoiceID ORDER BY s.StatUpdateAt DESC LIMIT 1) = 'Paid'
                ) AS totalRevenue,

                -- 3. Calculate New Customers for the period (Placeholder: 3)
                (
                    SELECT COUNT(CustID)
                    FROM (
                        SELECT CustID, MIN(OrderCreatedAt) as first_order_date
                        FROM Orders
                        WHERE ShopID = ?
                        GROUP BY CustID
                    ) AS customer_first_orders
                    WHERE ${newCustomerDateCondition} 
                ) AS newCustomers,

                -- 4. Aggregate chart data into a JSON string (Placeholder: 4)
                (
                    SELECT CONCAT('[', 
                        GROUP_CONCAT(
                            JSON_OBJECT('label', label, 'value', revenue) 
                            ORDER BY sortKey /* Fixed: Uses the alias from the inner query */
                        ), 
                    ']')
                    FROM (
                        SELECT
                            ${groupBy} AS sortKey, /* New: Column for explicit ordering */
                            DATE_FORMAT(o.OrderCreatedAt, ${dateFormat}) AS label,
                            SUM(i.PayAmount) AS revenue
                        FROM Orders o
                        JOIN Invoices i ON o.OrderID = i.OrderID
                        WHERE o.ShopID = ? AND ${dateCondition} AND (SELECT s.InvoiceStatus FROM Invoice_Status s WHERE s.InvoiceID = i.InvoiceID ORDER BY s.StatUpdateAt DESC LIMIT 1) = 'Paid'
                        GROUP BY sortKey, label
                    ) AS ChartData
                ) AS chartData;
        `;
        
        // Pass shopId for ALL four placeholders
        const [[results]] = await db.query(query, [shopId, shopId, shopId, shopId]);
        
        const chartDataArray = results.chartData ? JSON.parse(results.chartData) : [];

        res.json({
            totalOrders: results.totalOrders || 0,
            totalRevenue: results.totalRevenue || 0,
            newCustomers: results.newCustomers || 0, 
            chartData: chartDataArray,
        });

    } catch (error) {
        console.error("Error fetching dashboard summary:", error);
        res.status(500).json({ error: "Failed to fetch dashboard summary" });
    }
});


// POST /api/orders/report/order-types
// Fetches breakdown of orders by service type.
router.post("/report/order-types", async (req, res) => {
    const { shopId, period } = req.body; 

    if (!shopId) {
        return res.status(400).json({ error: "Shop ID is required" });
    }
    
    // Apply date filtering based on period
    const dateCondition = getDateCondition(period, 'o');

    try {
        const query = `
            SELECT 
                s.SvcName AS label,
                COUNT(o.OrderID) AS count
            FROM Orders o
            JOIN Services s ON o.SvcID = s.SvcID
            WHERE o.ShopID = ? AND ${dateCondition}
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

// POST /api/orders/report/top-employees
// Fetches Top 5 Employees by Revenue
router.post("/report/top-employees", async (req, res) => {
    const { shopId, period } = req.body; 

    if (!shopId) {
        return res.status(400).json({ error: "Shop ID is required" });
    }
    
    // Apply date filtering based on period
    const dateCondition = getDateCondition(period, 'o');
    
    try {
        const query = `
            SELECT
                s.StaffName as name,
                s.StaffRole as position,
                SUM(i.PayAmount) AS revenue
            FROM Invoices i
            JOIN Orders o ON i.OrderID = o.OrderID
            JOIN Staffs s ON o.StaffID = s.StaffID 
            WHERE o.ShopID = ? AND ${dateCondition}
                AND (SELECT invs.InvoiceStatus FROM Invoice_Status invs WHERE invs.InvoiceID = i.InvoiceID ORDER BY invs.StatUpdateAt DESC LIMIT 1) = 'Paid'
            GROUP BY s.StaffID, s.StaffName, s.StaffRole
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


export default router;