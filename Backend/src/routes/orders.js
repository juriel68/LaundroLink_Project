// routes/orders.js
import multer from 'multer';
import { cloudinary } from "../config/externalServices.js";
import express from "express";
import db from "../db.js";
import { logUserActivity } from '../utils/logger.js'; 

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// =================================================================
// Helper Functions
// =================================================================

// 💡 REFACTORED: Generates Prefix + 7 Random Digits (e.g., ODR9087127)
function generateID(prefix) {
    // Math.random() * 9000000 + 1000000 ensures it is always 7 digits (1000000 to 9999999)
    const randomDigits = Math.floor(1000000 + Math.random() * 9000000);
    return `${prefix}${randomDigits}`;
}

const getDateCondition = (period, alias) => {
    switch (period) {
        case "Today":
            return `DATE(${alias}.OrderCreatedAt) = CURDATE()`;
        case "Weekly":
        case "Last 7 Days":
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

router.post("/", async (req, res) => {
    console.log("--- START ORDER CREATION PROCESS ---");
    
    const {
        CustID, ShopID, SvcID, deliveryId, weight, instructions, fabrics, addons, 
        // 🔑 DATA FROM FRONTEND:
        finalDeliveryFee, deliveryOptionName 
    } = req.body;

    if (!CustID || !ShopID || !SvcID || !deliveryId || weight === undefined) {
        return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Assign Staff
        const [staffs] = await connection.query(
            `SELECT StaffID FROM Staffs WHERE ShopID = ? AND StaffRole = 'Cashier' ORDER BY StaffID ASC LIMIT 1`,
            [ShopID]
        );
        let assignedStaffID = staffs.length > 0 ? staffs[0].StaffID : null;

        // 2. Create Order Record
        const newOrderID = generateID('ODR'); 
        await connection.query(
            "INSERT INTO Orders (OrderID, CustID, StaffID, ShopID, OrderCreatedAt) VALUES (?, ?, ?, ?, NOW())",
            [newOrderID, CustID, assignedStaffID, ShopID]
        );

        // 3. Create Laundry Details
        const [lndryResult] = await connection.query(
            "INSERT INTO Laundry_Details (OrderID, SvcID, DlvryID, Kilogram, SpecialInstr) VALUES (?, ?, ?, ?, ?)",
            [newOrderID, SvcID, deliveryId, weight, instructions || null]
        );
        const newLndryDtlID = lndryResult.insertId; 

        // 4. Insert Fabrics
        if (fabrics && fabrics.length > 0) {
            const fabricPlaceholders = fabrics.map(() => `(?, ?)`).join(', ');
            const fabricValues = fabrics.flatMap(fabId => [newLndryDtlID, fabId]); 
            await connection.query(
                `INSERT INTO Order_Fabrics (LndryDtlID, FabID) VALUES ${fabricPlaceholders}`,
                fabricValues
            );
        }

        // 5. Insert Addons
        if (addons && addons.length > 0) {
            const addonPlaceholders = addons.map(() => `(?, ?)`).join(', ');
            const addonValues = addons.flatMap(addonId => [newLndryDtlID, addonId]);
            await connection.query(
                `INSERT INTO Order_AddOns (LndryDtlID, AddOnID) VALUES ${addonPlaceholders}`,
                addonValues
            );
        }

        // 6. CHECK DELIVERY TYPE TO SET STATUS
        const [optionResult] = await connection.query(
            "SELECT DlvryTypeID FROM Shop_Delivery_Options WHERE DlvryID = ?",
            [deliveryId]
        );

        let typeID = null;

        if (optionResult.length > 0) {
            typeID = optionResult[0].DlvryTypeID;
            let initialStatus = 'Pending'; // Default for Pick-up/P&D until paid

            // Global IDs: 1 = Drop-off Only, 3 = For Delivery (Client sends via courier)
            if (typeID === 1 || typeID === 3) {
                 initialStatus = 'To Weigh';
            }
            
            // Insert the status (Pending OR To Weigh)
            await connection.query(
                `INSERT INTO Order_Status (OrderID, OrderStatus, OrderUpdatedAt)
                 VALUES (?, ?, NOW())`,
                [newOrderID, initialStatus]
            );
        }
    
        // 7. Insert Delivery Payment Record (Conditional)
            // Logic: 
            // Type 1 (Drop-off): NO Insert
            // Type 3 (For Delivery): 'Pending Later'
            // Type 2/4 (Pick-up / P&D): 'Pending'     
        if (typeID !== null) { 
            if (typeID !== 1) {
                let dlvryPaymentStatus = 'Pending';
                if (typeID === 3) {
                    dlvryPaymentStatus = 'Pending Later';
                }

                await connection.query(
                    `INSERT INTO Delivery_Payments (OrderID, DlvryAmount, DlvryPaymentStatus, CreatedAt) 
                    VALUES (?, ?, ?, NOW())`,
                    [newOrderID, finalDeliveryFee, dlvryPaymentStatus]
                );
            }
        }
        
        await logUserActivity(CustID, 'Customer', 'Create Order', `New order created: ${newOrderID}`);

        await connection.commit();
        res.status(201).json({ success: true, message: "Order created successfully.", orderId: newOrderID });

    } catch (error) {
        await connection.rollback();
        console.error("❌ Create order error:", error);
        res.status(500).json({ success: false, message: "Failed to create order." });
    } finally {
        connection.release();
    }
});

// =================================================================
// API Routes: Order Fetching
// =================================================================

router.get("/customer/:customerId", async (req, res) => {
    const { customerId } = req.params;
    console.log("[DEBUG] Fetching customer orders for ID:", customerId); // ⬅️ DEBUG START
    try {
        const query = `
            WITH LatestOrderStatus AS (
                SELECT OrderID, OrderStatus, ROW_NUMBER() OVER (PARTITION BY OrderID ORDER BY OrderUpdatedAt DESC) as rn
                FROM Order_Status
            ),
            LatestDeliveryStatus AS (
                SELECT 
                    OrderID, 
                    DlvryStatus, 
                    UpdatedAt, 
                    ROW_NUMBER() OVER (PARTITION BY OrderID ORDER BY UpdatedAt DESC) as drn
                FROM Delivery_Status
            )
            SELECT 
                o.OrderID AS id,
                o.OrderCreatedAt AS createdAt,
                ls.ShopName AS shopName,
                s.SvcName AS serviceName,
                los.OrderStatus AS status,
                i.PayAmount AS totalAmount,
                i.PaymentStatus AS invoiceStatus,
                dp.DlvryAmount AS deliveryAmount,
                dp.DlvryPaymentStatus AS deliveryPaymentStatus,
                lds.DlvryStatus AS deliveryStatus
            FROM Orders o
            JOIN LatestOrderStatus los ON o.OrderID = los.OrderID AND los.rn = 1
            -- Join Latest Delivery Status using OrderID
            LEFT JOIN LatestDeliveryStatus lds ON o.OrderID = lds.OrderID AND lds.drn = 1
            JOIN Laundry_Details ld ON o.OrderID = ld.OrderID 
            JOIN Services s ON ld.SvcID = s.SvcID 
            JOIN Laundry_Shops ls ON o.ShopID = ls.ShopID
            LEFT JOIN Invoices i ON o.OrderID = i.OrderID
            LEFT JOIN Delivery_Payments dp ON o.OrderID = dp.OrderID
            WHERE o.CustID = ? 
            ORDER BY o.OrderCreatedAt DESC;
        `;
        
        console.log("[DEBUG] Executing query with customerId:", customerId); // ⬅️ DEBUG EXECUTION
        const [rows] = await db.query(query, [customerId]);
        
        console.log("[DEBUG] Query successful. Rows returned:", rows.length); // ⬅️ DEBUG RESULT
        res.json(rows);
    } catch (error) {
        console.error("[ERROR] Error fetching customer orders:", error); // ⬅️ DEBUG ERROR
        res.status(500).json({ error: "Failed to fetch customer orders" });
    }
});


// =================================================================
// 🟢 NEW: API Routes for Raw Statuses (Timeline Tracking)
// =================================================================

/**
 * GET /orders/:orderId/raw-statuses
 * Fetches all timestamped status updates from Order_Status, Delivery_Status, and
 * Order_Processing for a given OrderID.
 * * Returns: {
 * orderStatus: { [status: string]: { time: string } },
 * deliveryStatus: { [status: string]: { time: string } },
 * orderProcessing: { [status: string]: { time: string } }
 * }
 */
router.get("/:orderId/raw-statuses", async (req, res) => {
    const { orderId } = req.params;
    const connection = await db.getConnection();
    
    try {
        // --- 1. Order Status (High-level states) ---
        const [orderStatuses] = await connection.query(
            `SELECT OrderStatus as status, OrderUpdatedAt as time FROM Order_Status WHERE OrderID = ? ORDER BY OrderUpdatedAt ASC`,
            [orderId]
        );

        // --- 2. Delivery Status (Logistics states) ---
        const [deliveryStatuses] = await connection.query(
            `SELECT DlvryStatus as status, UpdatedAt as time FROM Delivery_Status WHERE OrderID = ? ORDER BY UpdatedAt ASC`,
            [orderId]
        );

        // --- 3. Order Processing Status (Washing, Drying, Folding steps) ---
        const [processStatuses] = await connection.query(
            `SELECT OrderProcStatus as status, OrderProcUpdatedAt as time FROM Order_Processing WHERE OrderID = ? ORDER BY OrderProcUpdatedAt ASC`,
            [orderId]
        );

        // Helper to convert arrays of {status, time} into a map {status: {time}}
        const mapStatuses = (rows) => {
            const statusMap = {};
            // The map structure automatically ensures the latest time is kept if duplicates exist,
            // but since we query ASC, we'll only see the first time a status was hit.
            rows.forEach(row => {
                statusMap[row.status] = { time: row.time };
            });
            return statusMap;
        };

        res.json({
            orderStatus: mapStatuses(orderStatuses),
            deliveryStatus: mapStatuses(deliveryStatuses),
            orderProcessing: mapStatuses(processStatuses)
        });

    } catch (error) {
        console.error("Error fetching raw statuses:", error);
        res.status(500).json({ error: "Failed to fetch raw tracking data" });
    } finally {
        connection.release();
    }
});

router.get("/:orderId/process-history", async (req, res) => {
    const { orderId } = req.params;
    try {
        const [processSteps] = await db.query(
            `SELECT OrderProcStatus AS status, OrderProcUpdatedAt AS time FROM Order_Processing WHERE OrderID = ? ORDER BY OrderProcUpdatedAt ASC`,
            [orderId]
        );
        const [coreStatuses] = await db.query(
            `SELECT OrderStatus AS status, OrderUpdatedAt AS time FROM Order_Status WHERE OrderID = ? ORDER BY OrderUpdatedAt ASC`,
            [orderId]
        );
        
        const combinedMap = new Map();
        coreStatuses.forEach(row => combinedMap.set(row.status, row));
        processSteps.forEach(row => combinedMap.set(row.status, row));
        const combinedTimeline = Array.from(combinedMap.values()).sort((a, b) => new Date(a.time) - new Date(b.time));

        res.json(combinedTimeline);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch tracking history." });
    }
});

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
            ),
            LatestDeliveryStatus AS (
                SELECT 
                    OrderID, 
                    DlvryStatus, 
                    UpdatedAt, 
                    ROW_NUMBER() OVER (PARTITION BY OrderID ORDER BY UpdatedAt DESC) as drn
                FROM Delivery_Status
            )
            SELECT 
                o.OrderID AS orderId,
                o.CustID AS customerId,
                o.ShopID AS shopId,
                ld.SvcID AS serviceId,
                ld.LndryDtlID AS laundryDetailId,
                ld.DlvryID AS deliveryOptionId,
                o.OrderCreatedAt AS createdAt,
                
                -- Order Status info
                los.OrderStatus AS laundryStatus,
                los.OrderUpdatedAt AS updatedAt,
                
                -- Customer & Service info
                c.CustName AS customerName,
                s.SvcName AS serviceName,
                
                -- Invoice info
                i.PaymentStatus as invoiceStatus,
                i.PayAmount as totalAmount, 

                -- Processing info
                (SELECT op.OrderProcStatus 
                 FROM Order_Processing op 
                 WHERE op.OrderID = o.OrderID 
                 ORDER BY op.OrderProcUpdatedAt DESC LIMIT 1) AS latestProcessStatus,

                -- Delivery Info
                lds.DlvryStatus AS deliveryStatus,            
                dp.DlvryPaymentStatus AS deliveryPaymentStatus,
                dp.DlvryAmount AS deliveryAmount,
                
                -- Extra details for Payment Modal
                pm.MethodName AS deliveryPaymentMethod,
                dp.StatusUpdatedAt AS deliveryPaymentDate,
                
                -- 🟢 UPDATED: Using subquery to fetch image from Delivery_Booking_Proofs 
                -- instead of the dropped DlvryProofImage column in Delivery_Payments
                (SELECT ImageUrl FROM Delivery_Booking_Proofs WHERE OrderID = o.OrderID ORDER BY UploadedAt DESC LIMIT 1) AS deliveryProofImage

            FROM Orders o
            JOIN Laundry_Details ld ON o.OrderID = ld.OrderID
            JOIN Customers c ON o.CustID = c.CustID
            JOIN Services s ON ld.SvcID = s.SvcID
            
            -- Join Latest Order Status
            LEFT JOIN LatestOrderStatus los ON o.OrderID = los.OrderID AND los.rn = 1
            
            -- Join Latest Delivery Status using OrderID
            LEFT JOIN LatestDeliveryStatus lds ON o.OrderID = lds.OrderID AND lds.drn = 1
            
            -- Join Delivery Payments using OrderID
            LEFT JOIN Delivery_Payments dp ON o.OrderID = dp.OrderID
            
            -- Join Payment Methods specifically for Delivery Payments
            LEFT JOIN Payment_Methods pm ON dp.MethodID = pm.MethodID

            LEFT JOIN Invoices i ON o.OrderID = i.OrderID
            
            WHERE o.ShopID = ? 
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
                c.CustAddress AS customerAddress,
                ls.shopID AS shopId,
                ls.ShopName AS shopName,
                ls.ShopAddress AS shopAddress,
                ls.ShopPhone AS shopPhone,
                i.InvoiceID AS invoiceId,
                ld.SvcID AS serviceId,
                s.SvcName AS serviceName,
                CAST(ss.SvcPrice AS DECIMAL(10, 2)) AS servicePrice, 
                CAST(ld.Kilogram AS DECIMAL(5, 1)) AS weight, 
                ld.SpecialInstr AS instructions,
                
                -- 🟢 NEW: Weight Proof Image (Customer CAN see this)
                ld.WeightProofImage AS weightProofImage,

                dt.DlvryTypeName AS deliveryType,
                CAST(dp.DlvryAmount AS DECIMAL(10, 2)) AS deliveryFee, 
                CAST(i.PayAmount AS DECIMAL(10, 2)) AS totalAmount,
                PM.MethodName AS paymentMethodName, 
                
                (SELECT os.OrderStatus FROM Order_Status os WHERE os.OrderID = o.OrderID ORDER BY os.OrderUpdatedAt DESC LIMIT 1) AS orderStatus,
                i.PaymentStatus as invoiceStatus,
                
                -- 🟢 NEW: Delivery Status
                (SELECT DlvryStatus FROM Delivery_Status WHERE OrderID = o.OrderID ORDER BY UpdatedAt DESC LIMIT 1) AS deliveryStatus,
                dp.DlvryPaymentStatus AS deliveryPaymentStatus

                -- ❌ REMOVED: Rejected_Orders join and columns
            FROM Orders o
            JOIN Laundry_Details ld ON o.OrderID = ld.OrderID
            LEFT JOIN Customers c ON o.CustID = c.CustID
            LEFT JOIN Laundry_Shops ls ON o.ShopID = ls.ShopID
            LEFT JOIN Services s ON ld.SvcID = s.SvcID
            LEFT JOIN Shop_Services ss ON o.ShopID = ss.ShopID AND ld.SvcID = ss.SvcID
            LEFT JOIN Shop_Delivery_Options SDO ON ld.DlvryID = SDO.DlvryID 
            LEFT JOIN Delivery_Types dt ON SDO.DlvryTypeID = dt.DlvryTypeID
            -- ❌ REMOVED: LEFT JOIN Rejected_Orders rej ON o.OrderID = rej.OrderID
            LEFT JOIN Invoices i ON o.OrderID = i.OrderID 
            LEFT JOIN Payment_Methods PM ON i.MethodID = PM.MethodID
            LEFT JOIN Delivery_Payments dp ON o.OrderID = dp.OrderID
            WHERE o.OrderID = ?;
        `;
        const [[orderDetails]] = await connection.query(orderQuery, [orderId]);

        if (!orderDetails) {
            return res.status(404).json({ error: "Order not found" });
        }
        
        const [fabrics] = await connection.query(
            `SELECT f.FabName AS FabricType FROM Order_Fabrics ofb 
             JOIN Fabrics f ON ofb.FabID = f.FabID
             JOIN Laundry_Details ld ON ofb.LndryDtlID = ld.LndryDtlID
             WHERE ld.OrderID = ?`,
            [orderId]
        );

        const [addons] = await connection.query(
            `SELECT a.AddOnName, CAST(SAO.AddOnPrice AS DECIMAL(10, 2)) AS AddOnPrice 
             FROM Order_AddOns oao 
             JOIN Add_Ons a ON oao.AddOnID = a.AddOnID
             JOIN Laundry_Details ld ON oao.LndryDtlID = ld.LndryDtlID
             JOIN Orders o ON ld.OrderID = o.OrderID
             JOIN Shop_Add_Ons SAO ON o.ShopID = SAO.ShopID AND a.AddOnID = SAO.AddOnID
             WHERE ld.OrderID = ?`,
            [orderId]
        );

        res.json({
            ...orderDetails,
            fabrics: fabrics.map(f => f.FabricType),
            addons: addons.map(a => ({ name: a.AddOnName, price: a.AddOnPrice }))
        });
    } catch (error) {
        console.error("Error fetching details:", error);
        res.status(500).json({ error: "Failed to fetch order details" });
    } finally {
        connection.release();
    }
});

// =================================================================
// API Routes: Actions (Cancel, Status, Payment)
// =================================================================

router.post("/cancel", async (req, res) => {
    const { orderId, userId, userRole } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Order Status (AUTO_INCREMENT ID, do not insert ID)
        await connection.query(
            "INSERT INTO Order_Status (OrderID, OrderStatus, OrderUpdatedAt) VALUES (?, 'Cancelled', NOW())",
            [orderId]
        );

        // 2. Invoices -> PaymentStatus 'Voided'
        await connection.query(
            "UPDATE Invoices SET PaymentStatus = 'Voided', StatusUpdatedAt = NOW() WHERE OrderID = ?",
            [orderId]
        );
        
        await logUserActivity(userId, userRole, 'Cancel Order', `Order ${orderId} cancelled.`);
        await connection.commit();
        res.status(200).json({ success: true, message: "Order cancelled and voided." });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: "Failed to cancel order." });
    } finally {
        connection.release();
    }
});

router.post("/status", async (req, res) => {
    const { orderId, newStatus, userId, userRole } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        // 1. Order Status (AUTO_INCREMENT ID, do not insert ID)
        await connection.query(
            "INSERT INTO Order_Status (OrderID, OrderStatus, OrderUpdatedAt) VALUES (?, ?, NOW())",
            [orderId, newStatus]
        );
        
        await logUserActivity(userId, userRole, 'Update Order Status', `Order ${orderId} status: ${newStatus}`);
        await connection.commit();
        res.status(200).json({ success: true, message: `Status updated to ${newStatus}` });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: "Failed to update status" });
    } finally {
        connection.release();
    }
});

// 🟢 NEW ROUTE: Update Weight with Proof & Message (Logic Updated for Insert/Update)
router.post("/weight/update-proof", upload.single("weightProof"), async (req, res) => {
    const { orderId, weight, userId, userRole } = req.body;
    
    if (!orderId || weight === undefined || !req.file) {
        return res.status(400).json({ message: "Missing Order ID, Weight, or Proof Image" });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Upload to Cloudinary
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        const uploadResult = await cloudinary.uploader.upload(dataURI, { folder: "laundrolink_weight_proofs" });

        // 2. Update Laundry Details (Weight & Proof)
        await connection.query(
            `UPDATE Laundry_Details SET Kilogram = ?, WeightProofImage = ? WHERE OrderID = ?`,
            [weight, uploadResult.secure_url, orderId]
        );

        // 3. Recalculate Invoice Amount
        // 🟢 UPDATED: Removed Invoices table from this query to purely calculate total
        const [calcData] = await connection.query(`
            SELECT 
                ss.SvcPrice, 
                (SELECT DlvryAmount FROM Delivery_Payments WHERE OrderID = ? AND DlvryPaymentStatus = 'Pending') as DlvryFee,
                (SELECT COALESCE(SUM(sao.AddOnPrice),0) FROM Order_AddOns oao 
                 JOIN Laundry_Details ld ON oao.LndryDtlID = ld.LndryDtlID
                 JOIN Orders o ON ld.OrderID = o.OrderID
                 JOIN Shop_Add_Ons sao ON o.ShopID = sao.ShopID AND oao.AddOnID = sao.AddOnID
                 WHERE ld.OrderID = ?) as AddonTotal
            FROM Orders o
            JOIN Laundry_Details ld ON o.OrderID = ld.OrderID
            JOIN Shop_Services ss ON o.ShopID = ss.ShopID AND ld.SvcID = ss.SvcID
            WHERE o.OrderID = ?
        `, [orderId, orderId, orderId]);

        if (calcData.length > 0) {
            const { SvcPrice, AddonTotal, DlvryFee } = calcData[0];
            const numericWeight = parseFloat(weight);
            const safeDlvryFee = parseFloat(DlvryFee) || 0; 
            
            const newTotal = (parseFloat(SvcPrice) * numericWeight) + parseFloat(AddonTotal) + safeDlvryFee;
            
            // 🟢 Separate check for existing invoice
            const [invoiceRows] = await connection.query("SELECT InvoiceID FROM Invoices WHERE OrderID = ?", [orderId]);

            if (invoiceRows.length > 0) {
                // Invoice exists (Re-weighing) -> UPDATE
                await connection.query(
                    "UPDATE Invoices SET PayAmount = ?, PaymentStatus = 'To Pay' WHERE InvoiceID = ?",
                    [newTotal, invoiceRows[0].InvoiceID]
                );
            } else {
                // Invoice missing (First weigh-in) -> INSERT
                const newInvoiceID = generateID('INV');
                await connection.query(
                    "INSERT INTO Invoices (InvoiceID, OrderID, PayAmount, PaymentStatus, PmtCreatedAt) VALUES (?, ?, ?, 'To Pay', NOW())",
                    [newInvoiceID, orderId, newTotal]
                );
            }
        }

        // 4. Insert Chat Message
        const [[orderInfo]] = await connection.query("SELECT CustID FROM Orders WHERE OrderID = ?", [orderId]);
        if (orderInfo) {
            const receiverId = orderInfo.CustID;
            
            const participant1 = userId < receiverId ? userId : receiverId;
            const participant2 = userId < receiverId ? receiverId : userId;
            
            let [[conversation]] = await connection.query(
                "SELECT ConversationID FROM Conversations WHERE Participant1_ID = ? AND Participant2_ID = ?",
                [participant1, participant2]
            );

            let conversationId;
            if (conversation) {
                conversationId = conversation.ConversationID;
            } else {
                const [convResult] = await connection.query(
                    "INSERT INTO Conversations (Participant1_ID, Participant2_ID, UpdatedAt) VALUES (?, ?, NOW())",
                    [participant1, participant2]
                );
                conversationId = convResult.insertId;
            }

            await connection.query(
                `INSERT INTO Messages (ConversationID, SenderID, ReceiverID, MessageText, MessageStatus, CreatedAt) 
                 VALUES (?, ?, ?, 'Weight has been updated, please proceed to payment.', 'Sent', NOW())`,
                [conversationId, userId, receiverId]
            );
        }

        await logUserActivity(userId, userRole, 'Update Weight', `Order ${orderId} weight updated to ${weight}kg with proof.`);
        await connection.commit();
        res.json({ success: true, message: "Weight updated and customer notified." });

    } catch (error) {
        await connection.rollback();
        console.error("Error updating weight with proof:", error);
        res.status(500).json({ message: "Failed to update weight." });
    } finally {
        connection.release();
    }
});

router.post("/customer/payment-submission", async (req, res) => {
    const { orderId, methodId, amount } = req.body;
    try {
        await db.query(
            "UPDATE Invoices SET MethodID = ?, PayAmount = ?, PaymentStatus = 'To Confirm', StatusUpdatedAt = NOW() WHERE OrderID = ?",
            [methodId, amount, orderId]
        );
        res.json({ success: true, message: "Payment submitted." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to submit payment." });
    }
});

router.post("/customer/delivery-payment-submission", async (req, res) => {
    const { orderId, methodId, amount } = req.body;
    
    if (!orderId || !methodId) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Update Delivery_Payments
        await connection.query(
            "UPDATE Delivery_Payments SET MethodID = ?, DlvryPaymentStatus = 'To Confirm', StatusUpdatedAt = NOW() WHERE OrderID = ?",
            [methodId, orderId]
        );

        await connection.commit();
        res.json({ success: true, message: "Delivery payment submitted for confirmation." });
    } catch (error) {
        await connection.rollback();
        console.error("Delivery payment error:", error);
        res.status(500).json({ error: "Failed to confirm delivery payment." });
    } finally {
        connection.release();
    }
});

// =================================================================
// STAFF PAYMENT ROUTES (Sets status to 'Paid')
// =================================================================

// 1. Staff confirms Service Payment (e.g. Wash & Dry)
router.post("/staff/confirm-service-payment", async (req, res) => {
    const { orderId, userId, userRole } = req.body;
    
    if (!orderId) return res.status(400).json({ error: "Missing Order ID" });

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Mark Invoice as PAID
        await connection.query(
            "UPDATE Invoices SET PaymentStatus = 'Paid', StatusUpdatedAt = NOW() WHERE OrderID = ?",
            [orderId]
        );

        // 2. Move Order Status to 'Processing' (since it is now paid)
        await connection.query(
            "INSERT INTO Order_Status (OrderID, OrderStatus, OrderUpdatedAt) VALUES (?, 'Processing', NOW())",
            [orderId]
        );

        await logUserActivity(userId, userRole, 'Confirm Payment', `Service payment confirmed for Order ${orderId}`);
        await connection.commit();
        res.json({ success: true, message: "Service payment confirmed." });

    } catch (error) {
        await connection.rollback();
        console.error("Staff confirm service payment error:", error);
        res.status(500).json({ error: "Failed to confirm payment." });
    } finally {
        connection.release();
    }
});

// 2. Staff confirms Delivery Payment
router.post("/staff/confirm-delivery-payment", async (req, res) => {
    const { orderId, userId, userRole } = req.body;

    if (!orderId) return res.status(400).json({ error: "Missing Order ID" });

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Mark Delivery Payment as PAID
        await connection.query(
            "UPDATE Delivery_Payments SET DlvryPaymentStatus = 'Paid', StatusUpdatedAt = NOW() WHERE OrderID = ?",
            [orderId]
        );

        // 1. Mark Delivery Status as To Pick-up 
        await connection.query(
            "INSERT INTO Delivery_Status (OrderID, DlvryStatus, UpdatedAt) VALUES (?, 'To Pick-up', NOW())",
            [orderId]
        );

        await logUserActivity(userId, userRole, 'Confirm Delivery Pay', `Delivery payment confirmed for Order ${orderId}`);
        await connection.commit();
        res.json({ success: true, message: "Delivery payment confirmed." });

    } catch (error) {
        await connection.rollback();
        console.error("Staff confirm delivery payment error:", error);
        res.status(500).json({ error: "Failed to confirm delivery payment." });
    } finally {
        connection.release();
    }
});

// =================================================================
// 🟢 NEW: DELIVERY WORKFLOW ROUTES
// =================================================================

// 1. Upload Booking Proof (Step 1 of 3rd Party App)
router.post("/delivery/upload-booking", upload.single("proofImage"), async (req, res) => {
    const { orderId, userId, userRole } = req.body;
    
    if (!orderId || !req.file) {
        return res.status(400).json({ message: "Missing Order ID or Proof Image" });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        const uploadResult = await cloudinary.uploader.upload(dataURI, { folder: "laundrolink_delivery_proofs" });

        await connection.query(
            "INSERT INTO Delivery_Status (OrderID, DlvryStatus, UpdatedAt) VALUES (?, 'Rider Booked', NOW())",
            [orderId]
        );
        
        await connection.query(
            `INSERT INTO Delivery_Booking_Proofs (OrderID, ImageUrl, UploadedAt) VALUES (?, ?, NOW())`,
            [orderId, uploadResult.secure_url]
        );

        await logUserActivity(userId, userRole, 'Delivery Booking', `Proof uploaded for Order ${orderId}`);

        await connection.commit();
        res.json({ success: true });
    } catch (error) {
        await connection.rollback();
        console.error("Error uploading booking proof:", error);
        res.status(500).json({ message: "Failed to upload proof." });
    } finally {
        connection.release();
    }
});

// 2. Update Delivery & Order Status (Generic Status Update)
// Handles: Delivered In Shop -> To Weigh, Arrived at Customer -> To Weigh, Delivered To Customer -> Completed
router.post("/delivery/update-status", async (req, res) => {
    const { orderId, newDlvryStatus, newOrderStatus, userId, userRole } = req.body;
    
    if (!orderId) return res.status(400).json({ message: "Missing Order ID" });

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Insert Delivery Status
        if (newDlvryStatus) {
            await connection.query(
                "INSERT INTO Delivery_Status (OrderID, DlvryStatus, UpdatedAt) VALUES (?, ?, NOW())",
                [orderId, newDlvryStatus]
            );
        }

        // Insert Order Status
        if (newOrderStatus) {
            await connection.query(
                "INSERT INTO Order_Status (OrderID, OrderStatus, OrderUpdatedAt) VALUES (?, ?, NOW())",
                [orderId, newOrderStatus]
            );
        }

        // Log
        await logUserActivity(userId, userRole, 'Update Delivery Status', `Order ${orderId}: ${newDlvryStatus}, ${newOrderStatus}`);

        await connection.commit();
        res.json({ success: true });
    } catch (error) {
        await connection.rollback();
        console.error("Error updating delivery status:", error);
        res.status(500).json({ message: "Failed to update status." });
    } finally {
        connection.release();
    }
});

router.post("/processing-status", async (req, res) => {
    const { orderId, status, userId, userRole } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // OrderProcID is AUTO_INCREMENT, removed manual ID
        await connection.query(
            "INSERT INTO Order_Processing (OrderID, OrderProcStatus, OrderProcUpdatedAt) VALUES (?, ?, NOW())",
            [orderId, status]
        );

        if (status === "Out for Delivery" || status === "Ready for Pickup") {
             const mapStatus = status === "Out for Delivery" ? "For Delivery" : "Ready for Pickup";
             // OrderStatID is AUTO_INCREMENT, removed manual ID
             await connection.query(
                "INSERT INTO Order_Status (OrderID, OrderStatus, OrderUpdatedAt) VALUES (?, ?, NOW())",
                [orderId, mapStatus]
            );
        }

        await logUserActivity(userId, userRole, 'Update Processing', `Order ${orderId}: ${status}`);
        await connection.commit();
        res.status(201).json({ success: true });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: "Failed to add status" });
    } finally {
        connection.release();
    }
});

// =================================================================
// API Routes: Dashboard & Reporting
// =================================================================

router.get("/overview/:shopId", async (req, res) => {
    const { shopId } = req.params;
    const { period, sortBy = 'OrderCreatedAt', sortOrder = 'DESC' } = req.query;
    const dateCondition = getDateCondition(period, 'o');

    try {
        const ordersQuery = `
            SELECT 
                o.OrderID, o.CustID, s.SvcName, i.PayAmount, o.OrderCreatedAt,
                (SELECT os.OrderStatus FROM Order_Status os WHERE os.OrderID = o.OrderID ORDER BY os.OrderUpdatedAt DESC LIMIT 1) AS OrderStatus
            FROM Orders o
            JOIN Laundry_Details ld ON o.OrderID = ld.OrderID
            JOIN Services s ON ld.SvcID = s.SvcID
            LEFT JOIN Invoices i ON o.OrderID = i.OrderID
            WHERE o.ShopID = ? AND ${dateCondition}
            ORDER BY ${sortBy} ${sortOrder}
        `;
        const [orders] = await db.query(ordersQuery, [shopId]);

        const summaryQuery = `
            SELECT
                SUM(CASE WHEN (SELECT os.OrderStatus FROM Order_Status os WHERE os.OrderID = o.OrderID ORDER BY os.OrderUpdatedAt DESC LIMIT 1) = 'Pending' THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN (SELECT os.OrderStatus FROM Order_Status os WHERE os.OrderID = o.OrderID ORDER BY os.OrderUpdatedAt DESC LIMIT 1) = 'Processing' THEN 1 ELSE 0 END) AS processing,
                SUM(CASE WHEN (SELECT os.OrderStatus FROM Order_Status os WHERE os.OrderID = o.OrderID ORDER BY os.OrderUpdatedAt DESC LIMIT 1) = 'For Delivery' THEN 1 ELSE 0 END) AS forDelivery,
                SUM(CASE WHEN (SELECT os.OrderStatus FROM Order_Status os WHERE os.OrderID = o.OrderID ORDER BY os.OrderUpdatedAt DESC LIMIT 1) = 'Completed' THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN (SELECT os.OrderStatus FROM Order_Status os WHERE os.OrderID = o.OrderID ORDER BY os.OrderUpdatedAt DESC LIMIT 1) = 'Rejected' THEN 1 ELSE 0 END) AS rejected
            FROM Orders o
            WHERE o.ShopID = ? AND ${dateCondition}
        `;
        const [summaryResults] = await db.query(summaryQuery, [shopId]);

        res.json({ summary: summaryResults[0] || {}, orders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch overview" });
    }
});

router.post("/dashboard-summary", async (req, res) => {
    const { shopId, period = 'Weekly' } = req.body;
    if (!shopId) return res.status(400).json({ error: "Shop ID required" });

    const orderDateCondition = getDateCondition(period, 'o');
    const chartDateFormat = period === 'Yearly' ? `'%Y'` : (period === 'Monthly' ? `'%b'` : `'%a'`);
    const chartGroupBy = period === 'Yearly' ? `YEAR(o.OrderCreatedAt)` : (period === 'Monthly' ? `DATE_FORMAT(o.OrderCreatedAt, '%Y-%m')` : `DAYOFWEEK(o.OrderCreatedAt)`);

    try {
        await db.query("SET SESSION group_concat_max_len = 1000000;");
        const query = `
            SELECT
                (SELECT COUNT(*) FROM Orders o WHERE o.ShopID = ? AND ${orderDateCondition}) AS totalOrders,
                (SELECT SUM(i.PayAmount) FROM Orders o JOIN Invoices i ON o.OrderID = i.OrderID WHERE o.ShopID = ? AND ${orderDateCondition} AND i.PaymentStatus = 'Paid') AS totalRevenue,
                (SELECT CONCAT('[', GROUP_CONCAT(JSON_OBJECT('label', label, 'value', revenue) ORDER BY sortKey), ']') FROM (
                    SELECT ${chartGroupBy} AS sortKey, DATE_FORMAT(o.OrderCreatedAt, ${chartDateFormat}) AS label, SUM(i.PayAmount) AS revenue
                    FROM Orders o JOIN Invoices i ON o.OrderID = i.OrderID
                    WHERE o.ShopID = ? AND ${orderDateCondition} AND i.PaymentStatus = 'Paid'
                    GROUP BY sortKey, label
                ) AS ChartData) AS chartData
        `;
        const [[results]] = await db.query(query, [shopId, shopId, shopId]);
        res.json({
            totalOrders: results.totalOrders || 0,
            totalRevenue: results.totalRevenue || 0,
            chartData: results.chartData ? JSON.parse(results.chartData) : []
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed" });
    }
});

router.post("/report/order-types", async (req, res) => {
    const { shopId, period } = req.body; 
    const dateCondition = getDateCondition(period, 'o');
    try {
        // Join Laundry_Details to get SvcID
        const query = `
            SELECT s.SvcName AS label, COUNT(o.OrderID) AS count
            FROM Orders o
            JOIN Laundry_Details ld ON o.OrderID = ld.OrderID
            JOIN Services s ON ld.SvcID = s.SvcID
            WHERE o.ShopID = ? AND ${dateCondition}
            GROUP BY s.SvcName
            ORDER BY count DESC;
        `;
        const [rows] = await db.query(query, [shopId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed" });
    }
});

router.get("/sales/:shopId", async (req, res) => {
    const { shopId } = req.params;
    const { period = 'Weekly', limit, offset } = req.query;
    const dateCondition = getDateCondition(period, 'o'); 
    const parsedLimit = parseInt(limit, 10) || 15;
    const parsedOffset = parseInt(offset, 10) || 0;

    try {
        const transactionsQuery = `
            SELECT o.OrderID, i.PayAmount, i.StatusUpdatedAt AS PaidAt
            FROM Orders o JOIN Invoices i ON o.OrderID = i.OrderID
            WHERE o.ShopID = ? AND ${dateCondition} AND i.PaymentStatus = 'Paid'
            ORDER BY PaidAt DESC LIMIT ? OFFSET ?`;

        const [transactions] = await db.query(transactionsQuery, [shopId, parsedLimit, parsedOffset]);

        const countQuery = `
            SELECT COUNT(o.OrderID) AS totalCount, SUM(i.PayAmount) AS totalSales
            FROM Orders o JOIN Invoices i ON o.OrderID = i.OrderID
            WHERE o.ShopID = ? AND ${dateCondition} AND i.PaymentStatus = 'Paid'`;
        
        const [countRows] = await db.query(countQuery, [shopId]);

        res.json({
            summary: { totalSales: countRows[0].totalSales || 0 },
            transactions: transactions,
            totalCount: countRows[0].totalCount || 0
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch sales" });
    }
});

router.post("/summary", async (req, res) => {
  const { shopId, dateRange } = req.body;

  if (!shopId || !dateRange) {
    return res.status(400).json({ error: "Shop ID and date range are required" });
  }

  // Local helper for this specific route's date logic
  const getSummaryDateCondition = (alias) => {
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
          o.OrderID,
          o.CustID,
          o.OrderCreatedAt,
          (SELECT os.OrderStatus FROM Order_Status os WHERE os.OrderID = o.OrderID ORDER BY os.OrderUpdatedAt DESC LIMIT 1) as status,
          i.PayAmount,
          i.PaymentStatus as InvoiceStatus
        FROM Orders o
        LEFT JOIN Invoices i ON o.OrderID = i.OrderID
        WHERE o.ShopID = ? AND ${getSummaryDateCondition("o")}
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

// POST /api/orders/report/top-employees
router.post("/report/top-employees", async (req, res) => {
    const { shopId, period } = req.body; 

    if (!shopId) {
        return res.status(400).json({ error: "Shop ID is required" });
    }
    
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
                AND i.PaymentStatus = 'Paid'
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