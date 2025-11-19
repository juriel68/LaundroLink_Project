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

const getDateCondition = (period, alias) => {
    switch (period) {
        case "Today":
            return `DATE(${alias}.OrderCreatedAt) = CURDATE()`;
        case "Weekly":
        case "Last 7 Days":
        default:
            // This is used by the reports.php frontend for "Last 7 Days"
            return `YEARWEEK(${alias}.OrderCreatedAt, 1) = YEARWEEK(CURDATE(), 1)`;
        case "Monthly":
        case "This Month":
            return `YEAR(${alias}.OrderCreatedAt) = YEAR(CURDATE()) AND MONTH(${alias}.OrderCreatedAt) = MONTH(CURDATE())`;
        case "Yearly":
        case "This Year":
            return `YEAR(${alias}.OrderCreatedAt) = YEAR(CURDATE())`;
    }
};

// Helper to determine date condition for sales queries
const getDateConditionForSales = (period, alias) => {
    switch (period) {
        case "Weekly":
        case "This Week":
        default:
            return `YEARWEEK(${alias}.OrderCreatedAt, 1) = YEARWEEK(CURDATE(), 1)`;
        case "Monthly":
        case "This Month":
            return `YEAR(${alias}.OrderCreatedAt) = YEAR(CURDATE()) AND MONTH(${alias}.OrderCreatedAt) = MONTH(CURDATE())`;
        case "Yearly":
        case "This Year":
            return `YEAR(${alias}.OrderCreatedAt) = YEAR(CURDATE())`;
    }
};


// =================================================================
// API Routes: Order Creation
// =================================================================

// Creates a new order along with related details, status, and invoice records.
router.post("/", async (req, res) => {
    console.log("--- START ORDER CREATION PROCESS ---");
    console.log("Payload received:", req.body);
    
    const {
        CustID, 
        ShopID, 
        SvcID,
        deliveryId, // This is DlvryID from Shop_Delivery_Options
        weight, 
        instructions, 
        fabrics,      // Array of FabIDs
        addons        // Array of AddOnIDs
    } = req.body;

    if (!CustID || !ShopID || !SvcID || !deliveryId || weight === undefined || !fabrics || fabrics.length === 0) {
        console.error("Validation failed: Missing required fields.");
        return res.status(400).json({ success: false, message: "Missing required fields (CustID, ShopID, SvcID, deliveryId, weight, fabrics)." });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        console.log("Transaction started successfully.");

        // Step 0: Assign staff (Logic remains the same)
        const [staffs] = await connection.query(
            `SELECT StaffID FROM Staffs WHERE ShopID = ? AND StaffRole = 'Cashier' ORDER BY StaffID ASC LIMIT 1`,
            [ShopID]
        );
        let assignedStaffID = staffs.length > 0 ? staffs[0].StaffID : null;
        if (!assignedStaffID) console.warn(`No cashier staff found for ShopID ${ShopID}.`);

        // 1. Insert into Laundry_Details (Logic remains the same)
        const newLndryDtlID = generateID('LD');
        await connection.query(
            "INSERT INTO Laundry_Details (LndryDtlID, Kilogram, SpecialInstr) VALUES (?, ?, ?)",
            [newLndryDtlID, weight, instructions || null]
        );

        // 2. Insert fabrics (uses FabID, FabID from global Fabrics table)
        if (fabrics && fabrics.length > 0) {
            console.log(`Step 2: Inserting ${fabrics.length} Fabric IDs.`);
            const fabricPlaceholders = fabrics.map(() => `(?, ?)`).join(', ');
            // 🔑 CHANGE 1: Use FabID from the global Fabrics table
            const fabricValues = fabrics.flatMap(fabId => [newLndryDtlID, fabId]); 
            await connection.query(
                `INSERT INTO Order_Fabrics (LndryDtlID, FabID) VALUES ${fabricPlaceholders}`,
                fabricValues
            );
        } else {
            console.log("Step 2: No fabrics to insert.");
        }

        // 3. Insert addons (uses AddOnID from global Add_Ons table)
        if (addons && Array.isArray(addons) && addons.length > 0) {
            console.log(`Step 3: Inserting ${addons.length} Add-Ons.`);
            const addonPlaceholders = addons.map(() => `(?, ?)`).join(', ');
            // 🔑 CHANGE 2: Use AddOnID from the global Add_Ons table
            const addonValues = addons.flatMap(addonId => [newLndryDtlID, addonId]);
            await connection.query(
                `INSERT INTO Order_AddOns (LndryDtlID, AddOnID) VALUES ${addonPlaceholders}`,
                addonValues
            );
        } else {
            console.log("Step 3: No Add-Ons to insert.");
        }

        // 4. Generate the main OrderID and insert into Orders table (Logic remains the same)
        const newOrderID = generateID('O');
        await connection.query(
            "INSERT INTO Orders (OrderID, CustID, ShopID, SvcID, StaffID, LndryDtlID, DlvryID, OrderCreatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
            [newOrderID, CustID, ShopID, SvcID, assignedStaffID, newLndryDtlID, deliveryId]
        );

        // 5, 6, 7. Initial Status, Invoice, and Invoice_Status (Logic remains the same)
        const newOrderStatId = generateID('OSD');
        await connection.query(
            "INSERT INTO Order_Status (OrderStatID, OrderID, OrderStatus, OrderUpdatedAt) VALUES (?, ?, 'Pending', NOW())",
            [newOrderStatId, newOrderID]
        );

        const newInvoiceID = generateID('INV');
        await connection.query(
            "INSERT INTO Invoices (InvoiceID, OrderID, DlvryFee, PayAmount) VALUES (?, ?, 0.00, 0.00)",
            [newInvoiceID, newOrderID] 
        );

        const newInvoiceStatID = generateID('IS');
        await connection.query(
            "INSERT INTO Invoice_Status (InvoiceStatusID, InvoiceID, InvoiceStatus, StatUpdateAt) VALUES (?, ?, 'Draft', NOW())",
            [newInvoiceStatID, newInvoiceID]
        );
        
        await logUserActivity(CustID, 'Customer', 'Create Order', `New order created: ${newOrderID} assigned to: ${assignedStaffID}`);

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
        console.log("Database connection released. --- END ORDER CREATION PROCESS ---");
    }
});

// =================================================================
// API Routes: Order Fetching (Shop & Customer)
// =================================================================

// GET /api/orders/customer/:customerId
// Fetch all orders for a specific customer.
router.get("/customer/:customerId", async (req, res) => {
    const { customerId } = req.params;
    
    console.log(`\n--- BACKEND: Fetching Order Previews for ${customerId} ---`);

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
        
        // 🚀 DIAGNOSTIC LOG: Display all fetched order details
        console.log(`[BACKEND LOG] Found ${rows.length} order previews.`);
        if (rows.length > 0) {
            rows.forEach(row => {
                console.log(` - ID: ${row.id}, Shop: ${row.shopName}, Status: ${row.status}, Total: ${row.totalAmount}`);
            });
        } else {
            console.log(" - No orders found for this customer.");
        }
        console.log("------------------------------------------");

        res.json(rows);
    } catch (error) {
        console.error("Error fetching customer orders:", error);
        res.status(500).json({ error: "Failed to fetch customer orders" });
    }
});


/**
 * GET /api/orders/:orderId/process-history
 * Fetches chronological process status updates for the order from Order_Processing and Order_Status tables.
 * This provides the full timeline necessary for the frontend tracking bar.
 */
router.get("/:orderId/process-history", async (req, res) => {
    const { orderId } = req.params;
    
    try {
        // 1. Fetch Process Steps (Washing, Folding, etc.)
        const [processSteps] = await db.query(
            `
            SELECT 
                OrderProcStatus AS status,
                OrderProcUpdatedAt AS time
            FROM Order_Processing
            WHERE OrderID = ?
            ORDER BY OrderProcUpdatedAt ASC;
            `,
            [orderId]
        );
        
        // 2. Fetch Core Statuses (Pending, Completed, Cancelled)
        const [coreStatuses] = await db.query(
            `
            SELECT 
                OrderStatus AS status,
                OrderUpdatedAt AS time
            FROM Order_Status
            WHERE OrderID = ?
            ORDER BY OrderUpdatedAt ASC;
            `,
            [orderId]
        );
        
        const combinedMap = new Map();
        
        // Process core statuses first (to ensure 'Pending' is recorded)
        coreStatuses.forEach(row => {
            if (!combinedMap.has(row.status)) {
                combinedMap.set(row.status, row);
            }
        });

        // Process granular steps
        processSteps.forEach(row => {
            // Overwrite if it's a sub-step, or if the status hasn't been recorded yet
            combinedMap.set(row.status, row);
        });

        const combinedTimeline = Array.from(combinedMap.values());

        // 4. Final sort by time to ensure perfect chronological order
        combinedTimeline.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

        res.json(combinedTimeline);
        
    } catch (error) {
        console.error("Error fetching process history:", error);
        res.status(500).json({ error: "Failed to fetch tracking history." });
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



// routes/orders.js (Excerpt: router.get("/:orderId"))

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
                i.InvoiceID AS invoiceId,
                (SELECT CustAddress FROM Cust_Addresses WHERE CustID = c.CustID LIMIT 1) AS customerAddress, 
                s.SvcName AS serviceName,
                
                CAST(ss.SvcPrice AS DECIMAL(10, 2)) AS servicePrice, 
                CAST(ld.Kilogram AS DECIMAL(5, 1)) AS weight, 
                ld.SpecialInstr AS instructions,
                
                -- 🔑 CHANGE 3: Join through Shop_Delivery_Options to Delivery_Types
                dt.DlvryTypeName AS deliveryType,
                SDO.DlvryDescription AS deliveryDescription,
                
                CAST(i.DlvryFee AS DECIMAL(10, 2)) AS deliveryFee, 
                CAST(i.PayAmount AS DECIMAL(10, 2)) AS totalAmount,
                
                PM.MethodName AS paymentMethodName, 
                
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
            
            -- 🔑 CHANGE 4: Update JOIN for Delivery Info
            LEFT JOIN Shop_Delivery_Options SDO ON o.DlvryID = SDO.DlvryID 
            LEFT JOIN Delivery_Types dt ON SDO.DlvryTypeID = dt.DlvryTypeID
            
            LEFT JOIN Rejected_Orders rej ON o.OrderID = rej.OrderID
            LEFT JOIN Invoices i ON o.OrderID = i.OrderID 
            LEFT JOIN Payment_Methods PM ON i.MethodID = PM.MethodID
            WHERE o.OrderID = ?;
        `;
        const [[orderDetails]] = await connection.query(orderQuery, [orderId]);

        if (!orderDetails) {
            return res.status(404).json({ error: "Order not found" });
        }
        
        // Fetch Fabrics (uses FabID from global Fabrics table)
        const [fabrics] = await connection.query(
            `SELECT f.FabName AS FabricType FROM Order_Fabrics ofb 
             -- 🔑 CHANGE 5: Join Order_Fabrics to the GLOBAL Fabrics table
             JOIN Fabrics f ON ofb.FabID = f.FabID
             WHERE ofb.LndryDtlID = (SELECT LndryDtlID FROM Orders WHERE OrderID = ?)`,
            [orderId]
        );

        // Fetch Addons (uses AddOnID from global Add_Ons table)
        const [addons] = await connection.query(
            `SELECT 
                a.AddOnName, 
                -- 🔑 CHANGE 6: Price MUST come from Shop_Add_Ons, not global Add_Ons (which doesn't store price)
                CAST(SAO.AddOnPrice AS DECIMAL(10, 2)) AS AddOnPrice 
             FROM Order_AddOns oao 
             JOIN Add_Ons a ON oao.AddOnID = a.AddOnID
             -- Link Order back to Shop to find the configured price
             JOIN Orders o ON oao.LndryDtlID = o.LndryDtlID
             JOIN Shop_Add_Ons SAO ON o.ShopID = SAO.ShopID AND a.AddOnID = SAO.AddOnID
             WHERE oao.LndryDtlID = (SELECT LndryDtlID FROM Orders WHERE OrderID = ?)`,
            [orderId]
        );

        res.json({
            ...orderDetails,
            fabrics: fabrics.map(f => f.FabricType),
            addons: addons.map(a => ({ name: a.AddOnName, price: a.AddOnPrice }))
        });
    } catch (error) {
        console.error("Error fetching order details:", error);
        res.status(500).json({ error: "Failed to fetch order details" });
    } finally {
        connection.release();
    }
});



// POST /api/orders/cancel
// Handles the cancellation of an order by updating Order_Status, Invoice_Status, and Rejected_Orders.
router.post("/cancel", async (req, res) => {
    const { orderId, userId, userRole } = req.body;
    
    if (!orderId || !userId) {
        return res.status(400).json({ success: false, message: "Order ID and User ID are required." });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Update Order_Status: Insert 'Cancelled' status
        const newOrderStatId = generateID('OSD'); 
        await connection.query(
            "INSERT INTO Order_Status (OrderStatID, OrderID, OrderStatus, OrderUpdatedAt) VALUES (?, ?, 'Cancelled', NOW())",
            [newOrderStatId, orderId]
        );

        // 2. Find the latest InvoiceID associated with this Order
        const [invoice] = await connection.query(
            "SELECT InvoiceID FROM Invoices WHERE OrderID = ?",
            [orderId]
        );

        if (invoice.length > 0) {
            const invoiceId = invoice[0].InvoiceID;
            
            // 3. Update Invoice_Status: Insert 'Voided' status
            const newInvoiceStatID = generateID('IS'); 
            await connection.query(
                "INSERT INTO Invoice_Status (InvoiceStatusID, InvoiceID, InvoiceStatus, StatUpdateAt) VALUES (?, ?, 'Voided', NOW())",
                [newInvoiceStatID, invoiceId]
            );
        }

        // 4. Update Rejected_Orders: Insert a record for the cancellation
        const newRejectedId = generateID('REJ');
        await connection.query(
            "INSERT INTO Rejected_Orders (RejectedID, OrderID, RejectionReason, RejectionNote, RejectedAt) VALUES (?, ?, ?, ?, NOW())",
            [newRejectedId, orderId, 'Customer Cancelled', null] // 'Customer Cancelled' is the reason, Note is NULL
        );
        
        // 5. Log the cancellation activity
        await logUserActivity(
            userId,
            userRole,
            'Cancel Order',
            `Order ${orderId} cancelled by ${userRole}.`
        );

        await connection.commit();
        
        res.status(200).json({ 
            success: true, 
            message: "Order has been successfully cancelled and voided." 
        });

    } catch (error) {
        await connection.rollback();
        console.error("❌ Error cancelling order:", error);
        res.status(500).json({ success: false, message: "Failed to cancel order due to a server error." });
    } finally {
        connection.release();
    }
});

// =================================================================
// API Routes: Status & Details Update
// =================================================================

// routes/orders.js (Excerpt: POST /api/orders/status)
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
        
        // 1. Insert the main status into the Order_Status table
        const newOrderStatId = generateID('OSD');
        await connection.query(
            "INSERT INTO Order_Status (OrderStatID, OrderID, OrderStatus, OrderUpdatedAt) VALUES (?, ?, ?, NOW())",
            [newOrderStatId, orderId, newStatus]
        );

        // 2. Handle Non-Successful Order Statuses (Rejected or Cancelled)
        if (newStatus === "Rejected" || newStatus === "Cancelled") {
            
            let rejectionReason;
            let invoiceStatusToUse;
            
            if (newStatus === "Rejected") {
                 rejectionReason = reason || 'Order Rejected by Shop';
                 invoiceStatusToUse = 'Rejected'; 
            } else { // newStatus === "Cancelled" (Customer initiated)
                 rejectionReason = 'Customer Initiated Cancellation';
                 invoiceStatusToUse = 'Cancelled';
            }
            
            // 2a. Insert record into Rejected_Orders table
            const newRejectedId = generateID('REJ');
            await connection.query(
                "INSERT INTO Rejected_Orders (RejectedID, OrderID, RejectionReason, RejectionNote, RejectedAt) VALUES (?, ?, ?, ?, NOW())",
                [newRejectedId, orderId, rejectionReason, note || null]
            );

            // 2b. Insert the appropriate status into Invoice_Status
            const [invoice] = await connection.query(
                "SELECT InvoiceID FROM Invoices WHERE OrderID = ?",
                [orderId]
            );

            if (invoice.length > 0) {
                const invoiceId = invoice[0].InvoiceID;
                const newInvoiceStatID = generateID('IS');
                await connection.query(
                    "INSERT INTO Invoice_Status (InvoiceStatusID, InvoiceID, InvoiceStatus, StatUpdateAt) VALUES (?, ?, ?, NOW())",
                    [newInvoiceStatID, invoiceId, invoiceStatusToUse]
                );
            }
            
            // 🔑 2c. CRITICAL FIX: INSERT STATIC CANCELLATION MESSAGE
            if (newStatus === "Cancelled") {
                const [orderParticipants] = await connection.query(
                    `SELECT CustID, StaffID, ShopID FROM Orders WHERE OrderID = ?`, 
                    [orderId]
                );
                
                // Determine participants for the conversation thread
                const customerId = orderParticipants[0].CustID;
                const shopPartyId = orderParticipants[0].StaffID || orderParticipants[0].ShopID; 

                // Sender is the current user (Customer)
                const sender = userId; 
                // Receiver is the other party (Staff/Shop)
                const receiver = (userId === customerId) ? shopPartyId : customerId; 
                
                const participant1 = customerId < shopPartyId ? customerId : shopPartyId;
                const participant2 = customerId < shopPartyId ? shopPartyId : customerId;

                // Find or Create the Conversation
                let [[conversation]] = await connection.query(
                    "SELECT ConversationID FROM Conversations WHERE Participant1_ID = ? AND Participant2_ID = ?",
                    [participant1, participant2]
                );
                
                let conversationId;
                if (conversation) {
                    conversationId = conversation.ConversationID;
                } else {
                    conversationId = generateID('CONV');
                    await connection.query(
                        "INSERT INTO Conversations (ConversationID, Participant1_ID, Participant2_ID, UpdatedAt) VALUES (?, ?, ?, NOW())",
                        [conversationId, participant1, participant2]
                    );
                }

                // Insert the new message: "❌ The order was cancelled"
                const newMessageId = generateID('MSG');
                const staticMessageText = "❌ The order was cancelled";

                await connection.query(
                    `INSERT INTO Messages 
                     (MessageID, ConversationID, SenderID, ReceiverID, MessageText, MessageStatus, CreatedAt) 
                     VALUES (?, ?, ?, ?, ?, 'Delivered', NOW())`, 
                    [newMessageId, conversationId, sender, receiver, staticMessageText]
                );
                
                // Update conversation timestamp
                await connection.query(
                    "UPDATE Conversations SET UpdatedAt = NOW() WHERE ConversationID = ?",
                    [conversationId]
                );
            }
        }
        
        // 3. Log Order Status Change
        await logUserActivity(userId, userRole, 'Update Order Status', `Order ${orderId} status changed to: ${newStatus}`);

        await connection.commit();

        res
            .status(200)
            .json({ success: true, message: `Order status updated to ${newStatus} successfully` });
    } catch (error) {
        await connection.rollback();
        console.error("Error updating order status:", error);
        res.status(500).json({ error: "Failed to update order status" });
    } finally {
        connection.release();
    }
});


// PATCH /api/orders/weight route (orders.js)
router.patch("/weight", async (req, res) => {
    // 🔑 isFinal flag is still destructured but no longer used for conditional logic
    const { orderId, newWeight, isFinal = true, userId, userRole } = req.body; 

    if (!orderId || newWeight === undefined) {
        return res.status(400).json({ error: "Order ID and new weight are required" });
    }
    
    const validatedWeight = parseFloat(newWeight);
    if (isNaN(validatedWeight) || validatedWeight < 0) {
        return res.status(400).json({ success: false, message: "Invalid weight value." });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Fetch necessary details, INCLUDING pricing components
        const [orderData] = await connection.query(
            `
            SELECT 
                o.LndryDtlID, o.CustID, o.ShopID, o.SvcID,
                i.InvoiceID, i.DlvryFee,
                ss.SvcPrice 
            FROM Orders o
            JOIN Invoices i ON o.OrderID = i.OrderID
            JOIN Shop_Services ss ON o.ShopID = ss.ShopID AND o.SvcID = ss.SvcID
            WHERE o.OrderID = ?
            `,
            [orderId]
        );

        if (orderData.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        const { LndryDtlID, CustID, ShopID, SvcPrice, InvoiceID, DlvryFee } = orderData[0];
        const flatServicePrice = parseFloat(SvcPrice);
        const deliveryFee = parseFloat(DlvryFee);

        // 1.5. Calculate total cost of Add-Ons
        const [addonCosts] = await connection.query(
            `
            SELECT SUM(SAO.AddOnPrice) AS totalAddOnCost
            FROM Order_AddOns oao
            JOIN Shop_Add_Ons SAO ON SAO.AddOnID = oao.AddOnID AND SAO.ShopID = ?
            WHERE oao.LndryDtlID = ?
            `,
            [ShopID, LndryDtlID]
        );
        
        const totalAddOnCost = parseFloat(addonCosts[0].totalAddOnCost) || 0.00;

        // 2. Update the weight in Laundry_Details
        const weightColumn = 'Kilogram'; // Assuming all updates are to the primary weight field
        await connection.query(
            `
            UPDATE Laundry_Details
            SET ${weightColumn} = ?
            WHERE LndryDtlID = ?
            `,
            [validatedWeight, LndryDtlID]
        );
        
        // 🔑 FIX: ALWAYS CALCULATE AND UPDATE INVOICE PAYAMOUNT
        const newPayAmount = flatServicePrice + totalAddOnCost + deliveryFee;

        await connection.query(
            `
            UPDATE Invoices
            SET PayAmount = ?
            WHERE InvoiceID = ?
            `,
            [newPayAmount.toFixed(2), InvoiceID]
        );
        console.log(`[INVOICE] Final PayAmount updated to: ${newPayAmount.toFixed(2)}`);

        // --- Messaging Logic ---
        const senderId = userId; 
        const receiverId = CustID; 
        
        const invoiceJsonData = {
            type: "INVOICE_FINALIZED", // Type changed to reflect final action
            orderId: orderId,
            shopId: ShopID, 
            newWeight: validatedWeight.toFixed(2),
            finalTotal: newPayAmount.toFixed(2), // Include final total in message payload
        };

        const readablePrefix = `FINAL weight confirmed: ${validatedWeight.toFixed(2)} kg. The invoice total has been updated.`;
            
        const invoiceJsonString = JSON.stringify(invoiceJsonData);
        const finalMessageText = `${readablePrefix}\n${invoiceJsonString}`;

        const participant1 = senderId < receiverId ? senderId : receiverId;
        const participant2 = senderId < receiverId ? receiverId : senderId;

        let [[conversation]] = await connection.query(
            "SELECT ConversationID FROM Conversations WHERE Participant1_ID = ? AND Participant2_ID = ?",
            [participant1, participant2]
        );

        let conversationId;
        if (conversation) {
            conversationId = conversation.ConversationID;
        } else {
            conversationId = generateID('CONV'); 
            await connection.query(
                "INSERT INTO Conversations (ConversationID, Participant1_ID, Participant2_ID, UpdatedAt) VALUES (?, ?, ?, NOW())",
                [conversationId, participant1, participant2]
            );
        }

        const newMessageId = generateID('MSG');
        await connection.query(
            `INSERT INTO Messages 
             (MessageID, ConversationID, SenderID, ReceiverID, MessageText, MessageStatus, CreatedAt) 
             VALUES (?, ?, ?, ?, ?, 'Delivered', NOW())`,
            [newMessageId, conversationId, senderId, receiverId, finalMessageText]
        );

        await connection.query(
            "UPDATE Conversations SET UpdatedAt = NOW() WHERE ConversationID = ?",
            [conversationId]
        );
        
        await logUserActivity(userId, userRole, 'Update Order Details', `Order ${orderId}: FINAL Weight set to ${validatedWeight} kg. Invoice finalized.`);

        await connection.commit();

        res.status(200).json({ 
            success: true, 
            message: "Final weight and invoice saved."
        });
        
    } catch (error) {
        await connection.rollback();
        console.error("Error during weight update and messaging:", error);
        res.status(500).json({ success: false, message: "Failed to update weight and finalize invoice." });
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


router.post("/dashboard-summary", async (req, res) => {
    const { shopId, period = 'Weekly' } = req.body; 

    if (!shopId) {
        return res.status(400).json({ error: "Shop ID is required" });
    }

    // --- Dynamic Date Conditions ---
    const orderDateCondition = getDateCondition(period, 'o');
    const chartGroupBy = period === 'Yearly' ? `YEAR(o.OrderCreatedAt)` : 
                         (period === 'Monthly' ? `DATE_FORMAT(o.OrderCreatedAt, '%Y-%m')` : `DAYOFWEEK(o.OrderCreatedAt)`);
    const chartDateFormat = period === 'Yearly' ? `'%Y'` : 
                            (period === 'Monthly' ? `'%b'` : `'%a'`);

    // Special condition for New Customers (needs to check the user's first order date)
    const newCustomerDateCondition = period === 'Yearly' ? `YEAR(first_order_date) = YEAR(CURDATE())` : 
                                     (period === 'Monthly' ? `YEAR(first_order_date) = YEAR(CURDATE()) AND MONTH(first_order_date) = MONTH(CURDATE())` : 
                                     `YEARWEEK(first_order_date, 1) = YEARWEEK(CURDATE(), 1)`);

    try {
        await db.query("SET SESSION group_concat_max_len = 1000000;");
        
        // This query fetches all KPIs and the chart trend data in one go
        const query = `
            SELECT
                -- 1. Total Orders for the period
                (SELECT COUNT(*) FROM Orders o WHERE o.ShopID = ? AND ${orderDateCondition}) AS totalOrders,
                
                -- 2. Total Revenue (Paid Invoices only)
                (SELECT SUM(i.PayAmount) 
                    FROM Orders o 
                    JOIN Invoices i ON o.OrderID = i.OrderID
                    WHERE o.ShopID = ? AND ${orderDateCondition} 
                    AND (SELECT s.InvoiceStatus FROM Invoice_Status s WHERE s.InvoiceID = i.InvoiceID ORDER BY s.StatUpdateAt DESC LIMIT 1) = 'Paid'
                ) AS totalRevenue,

                -- 3. New Customers for the period
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

                -- 4. Aggregate Sales Trend chart data
                (
                    SELECT CONCAT('[', 
                        GROUP_CONCAT(
                            JSON_OBJECT('label', label, 'value', revenue) 
                            ORDER BY sortKey
                        ), 
                    ']')
                    FROM (
                        SELECT
                            ${chartGroupBy} AS sortKey,
                            DATE_FORMAT(o.OrderCreatedAt, ${chartDateFormat}) AS label,
                            SUM(i.PayAmount) AS revenue
                        FROM Orders o
                        JOIN Invoices i ON o.OrderID = i.OrderID
                        WHERE o.ShopID = ? AND ${orderDateCondition} AND (SELECT s.InvoiceStatus FROM Invoice_Status s WHERE s.InvoiceID = i.InvoiceID ORDER BY s.StatUpdateAt DESC LIMIT 1) = 'Paid'
                        GROUP BY sortKey, label
                    ) AS ChartData
                ) AS chartData;
        `;
        
        // Pass shopId four times for the four subqueries
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

router.get("/sales/:shopId", async (req, res) => {
    const { shopId } = req.params;
    const { period = 'Weekly', limit, offset } = req.query;

    if (!shopId) {
        return res.status(400).json({ error: "Shop ID is required" });
    }

    // Use the localized date condition function
    const dateCondition = getDateConditionForSales(period, 'o'); 
    
    // Determine limit/offset for pagination
    const parsedLimit = parseInt(limit, 10) || 15;
    const parsedOffset = parseInt(offset, 10) || 0;

    const connection = await db.getConnection();
    try {
        // 1. Transaction List Query (Paginated)
        const transactionsQuery = `
            SELECT 
                o.OrderID,
                i.PayAmount,
                (SELECT isf.PaidAt FROM Invoice_Status isf WHERE isf.InvoiceID = i.InvoiceID ORDER BY isf.StatUpdateAt DESC LIMIT 1) AS PaidAt
            FROM 
                Orders o
            JOIN 
                Invoices i ON o.OrderID = i.OrderID
            WHERE 
                o.ShopID = ? AND ${dateCondition} 
                AND (SELECT isf.InvoiceStatus FROM Invoice_Status isf WHERE isf.InvoiceID = i.InvoiceID ORDER BY isf.StatUpdateAt DESC LIMIT 1) = 'Paid'
            ORDER BY
                PaidAt DESC
            LIMIT ? OFFSET ?;
        `;

        const [transactions] = await connection.query(transactionsQuery, [shopId, parsedLimit, parsedOffset]);

        // 2. Total Count & Summary Query
        const countQuery = `
            SELECT 
                COUNT(o.OrderID) AS totalCount,
                SUM(i.PayAmount) AS totalSales,
                COUNT(o.OrderID) AS totalOrders
            FROM 
                Orders o
            JOIN 
                Invoices i ON o.OrderID = i.OrderID
            WHERE 
                o.ShopID = ? AND ${dateCondition} 
                AND (SELECT isf.InvoiceStatus FROM Invoice_Status isf WHERE isf.InvoiceID = i.InvoiceID ORDER BY isf.StatUpdateAt DESC LIMIT 1) = 'Paid'
            `;
        
        const [countRows] = await connection.query(countQuery, [shopId]);
        
        const summary = {
            totalSales: countRows[0].totalSales || 0,
            totalOrders: countRows[0].totalOrders || 0
        };
        const totalCount = countRows[0].totalCount || 0;

        res.json({
            summary: summary,
            transactions: transactions,
            totalCount: totalCount
        });

    } catch (error) {
        console.error("Error fetching sales data:", error);
        res.status(500).json({ error: "Failed to fetch sales data." });
    } finally {
        connection.release();
    }
});

export default router;