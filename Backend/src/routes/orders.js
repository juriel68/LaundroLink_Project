import express from "express";
import db from "../db.js";

const router = express.Router();

// ✅ MODIFIED: The query has been rewritten for accuracy and reliability.
router.get("/shop/:shopId", async (req, res) => {
  const { shopId } = req.params;
  try {
    const [rows] = await db.query(
      `
      WITH LatestOrderStatus AS (
          -- This CTE (Common Table Expression) finds the most recent status for each order.
          -- It works by assigning a row number to each status update for an order, starting
          -- with 1 for the newest update.
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
          los.OrderStatus AS status, -- <-- Get the status from our CTE
          los.OrderUpdatedAt AS updatedAt, -- <-- Get the timestamp from our CTE
          c.CustName AS customerName,
          rej.RejectionReason as reason,
          rej.RejectionNote as note,
          (
              -- This subquery gets the latest processing sub-status.
              SELECT op.OrderProcStatus 
              FROM Order_Processing op 
              WHERE op.OrderID = o.OrderID 
              ORDER BY op.OrderProcUpdatedAt DESC 
              LIMIT 1
          ) AS latestProcessStatus
      FROM Orders o
      JOIN Customer c ON o.CustID = c.CustID
      -- Join with our CTE to get only the latest status.
      JOIN LatestOrderStatus los ON o.OrderID = los.OrderID
      LEFT JOIN Rejected_Order rej ON o.OrderID = rej.OrderID
      -- Filter for the specific shop AND only the most recent status (rn = 1).
      WHERE o.ShopID = ? AND los.rn = 1
      ORDER BY o.OrderCreatedAt DESC; -- Added ordering for consistency
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
        "INSERT INTO Rejected_Order (RejectedID, OrderID, RejectionReason, RejectionNote, RejectedAt) VALUES (?, ?, ?, ?, NOW())",
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
        (SELECT CustAddress FROM Cust_Address WHERE CustID = c.CustID LIMIT 1) AS customerAddress,
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
      LEFT JOIN Customer c ON o.CustID = c.CustID
      LEFT JOIN Service s ON o.SvcID = s.SvcID
      LEFT JOIN Shop_Service ss ON o.ShopID = ss.ShopID AND o.SvcID = ss.SvcID
      LEFT JOIN Laundry_Details ld ON o.LndryDtlID = ld.LndryDtlID
      LEFT JOIN Delivery_Option do ON o.DlvryID = do.DlvryID
      LEFT JOIN Rejected_Order rej ON o.OrderID = rej.OrderID
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
      WITH FilteredOrders AS (
        SELECT 
          o.*,
          os.OrderStatus AS status,
          inv.PayAmount,
          inv_s.Status AS paymentStatus
        FROM Orders o
        LEFT JOIN (
          SELECT OrderID, OrderStatus FROM Order_Status WHERE (OrderID, OrderUpdatedAt) IN 
          (SELECT OrderID, MAX(OrderUpdatedAt) FROM Order_Status GROUP BY OrderID)
        ) AS os ON o.OrderID = os.OrderID
        LEFT JOIN Invoice inv ON o.OrderID = inv.OrderID
        LEFT JOIN Invoice_Status inv_s ON inv.InvoiceID = inv_s.InvoiceID
        WHERE o.ShopID = ? AND ${getDateCondition("o")}
      ),
      ChartData AS (
        SELECT
          DATE_FORMAT(OrderCreatedAt, '%a') AS label,
          SUM(PayAmount) AS revenue
        FROM FilteredOrders
        WHERE paymentStatus = 'Paid'
        GROUP BY label
      ),
      RecentOrders AS (
        SELECT
          OrderID AS id,
          (SELECT CustName FROM Customer WHERE CustID = FilteredOrders.CustID) AS customer,
          status,
          PayAmount AS amount
        FROM FilteredOrders
        ORDER BY OrderCreatedAt DESC
        LIMIT 10
      )
      SELECT
        (SELECT COUNT(*) FROM FilteredOrders) AS totalOrders,
        (SELECT SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) FROM FilteredOrders) AS completedOrders,
        (SELECT SUM(CASE WHEN status NOT IN ('Completed', 'Rejected', 'Cancelled') THEN 1 ELSE 0 END) FROM FilteredOrders) AS pendingOrders,
        (SELECT SUM(CASE WHEN paymentStatus = 'Paid' THEN PayAmount ELSE 0 END) FROM FilteredOrders) AS totalRevenue,
        (SELECT CONCAT('[', GROUP_CONCAT(JSON_OBJECT('label', label, 'revenue', revenue)), ']') FROM ChartData) AS chartData,
        (SELECT CONCAT('[', GROUP_CONCAT(JSON_OBJECT('id', id, 'customer', customer, 'status', status, 'amount', amount)), ']') FROM RecentOrders) AS recentOrders;
    `;

    const [[results]] = await db.query(query, [shopId]);
    
    results.chartData = results.chartData ? JSON.parse(results.chartData) : [];
    results.recentOrders = results.recentOrders
      ? JSON.parse(results.recentOrders)
      : [];

    res.json(results);
  } catch (error) {
    console.error("Error fetching order summary:", error);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});

export default router;