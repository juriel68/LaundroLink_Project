// Backend/src/routes/admin.js

import express from "express";
// Imports the default export (the pool) as 'db' and the named export (runSystemBackup).
import db, { runSystemBackup, BACKUP_DIR } from "../db.js";
// Imports the default export (systemLogger) from the utils folder.
import logger from "../utils/logger.js"; 
import { Parser } from 'json2csv'; 
import fs from 'fs'; 
import path from 'path'; 

const router = express.Router();

// Helper function to dynamically generate SQL date condition
const getDateCondition = (period, alias = 'o') => {
    switch (period) {
        case 'Monthly':
            // Uses OrderCreatedAt from the Orders table
            return `YEAR(${alias}.OrderCreatedAt) = YEAR(CURDATE()) AND MONTH(${alias}.OrderCreatedAt) = MONTH(CURDATE())`;
        case 'Yearly':
            return `YEAR(${alias}.OrderCreatedAt) = YEAR(CURDATE())`;
        case 'Weekly':
        default:
            return `YEARWEEK(${alias}.OrderCreatedAt, 1) = YEARWEEK(CURDATE(), 1)`;
    }
};

// =======================================================
// 1. System Settings Routes (config)
// (Existing Routes Omitted for Brevity)
// =======================================================
// ...

// =======================================================
// 2. Backup Routes
// (Existing Routes Omitted for Brevity)
// =======================================================
// ...

// =======================================================
// 3. Admin Reporting Routes (Corrected for Schema)
// =======================================================

/**
 * 🆕 POST /api/admin/report/platform-summary
 * Fetches platform-wide aggregated metrics (Revenue, Orders, New Shops, Growth Trend).
 */
router.post("/report/platform-summary", async (req, res) => {
    const { period = 'Weekly' } = req.body; 

    let groupBy, dateFormat, dateCondition;
    let shopDateCondition;
    
    switch (period) {
        case 'Monthly':
            groupBy = `DATE_FORMAT(o.OrderCreatedAt, '%Y-%m')`;
            dateFormat = `'%b'`;
            dateCondition = `YEAR(o.OrderCreatedAt) = YEAR(CURDATE()) AND MONTH(o.OrderCreatedAt) = MONTH(CURDATE())`;
            // FIX: Use Users.DateCreated via Shop Owners (u.DateCreated)
            shopDateCondition = `YEAR(u.DateCreated) = YEAR(CURDATE()) AND MONTH(u.DateCreated) = MONTH(CURDATE())`;
            break;
        case 'Yearly':
            groupBy = `YEAR(o.OrderCreatedAt)`;
            dateFormat = `'%Y'`;
            dateCondition = `YEAR(o.OrderCreatedAt) = YEAR(CURDATE())`;
            // FIX: Use Users.DateCreated via Shop Owners (u.DateCreated)
            shopDateCondition = `YEAR(u.DateCreated) = YEAR(CURDATE())`;
            break;
        case 'Weekly':
        default:
            groupBy = `DAYOFWEEK(o.OrderCreatedAt)`;
            dateFormat = `'%a'`;
            dateCondition = `YEARWEEK(o.OrderCreatedAt, 1) = YEARWEEK(CURDATE(), 1)`;
            // FIX: Use Users.DateCreated via Shop Owners (u.DateCreated)
            shopDateCondition = `YEARWEEK(u.DateCreated, 1) = YEARWEEK(CURDATE(), 1)`;
    }

    try {
        await db.query("SET SESSION group_concat_max_len = 1000000;");

        const query = `
            SELECT
                -- 1. Total Platform Orders 
                (SELECT COUNT(*) FROM Orders) AS totalOrders,
                
                -- 2. Total Platform Revenue (Paid Invoices only)
                (SELECT SUM(i.PayAmount) 
                    FROM Orders o 
                    JOIN Invoices i ON o.OrderID = i.OrderID
                    WHERE ${dateCondition} 
                    -- FIX: Use Invoice_Status table and correct column name (InvoiceStatus)
                    AND (SELECT invs.InvoiceStatus FROM Invoice_Status invs WHERE invs.InvoiceID = i.InvoiceID ORDER BY invs.StatUpdateAt DESC LIMIT 1) = 'Paid'
                ) AS totalRevenue,

                -- 3. New Shops Onboarded 
                (
                    SELECT COUNT(ls.ShopID)
                    FROM Laundry_Shops ls -- FIX: Use Laundry_Shops table name
                    JOIN Shop_Owners so ON ls.OwnerID = so.OwnerID
                    JOIN Users u ON so.OwnerID = u.UserID -- FIX: Get creation date from Users (u.DateCreated)
                    WHERE ${shopDateCondition} 
                ) AS newShops,

                -- 4. Aggregate revenue trend data
                (
                    SELECT CONCAT('[', 
                        GROUP_CONCAT(
                            JSON_OBJECT('label', label, 'value', revenue) 
                            ORDER BY sortKey
                        ), 
                    ']')
                    FROM (
                        SELECT
                            ${groupBy} AS sortKey,
                            DATE_FORMAT(o.OrderCreatedAt, ${dateFormat}) AS label,
                            SUM(i.PayAmount) AS revenue
                        FROM Orders o
                        JOIN Invoices i ON o.OrderID = i.OrderID
                        WHERE ${dateCondition} 
                        -- FIX: Use Invoice_Status table and correct column name (InvoiceStatus)
                        AND (SELECT invs.InvoiceStatus FROM Invoice_Status invs WHERE invs.InvoiceID = i.InvoiceID ORDER BY invs.StatUpdateAt DESC LIMIT 1) = 'Paid'
                        GROUP BY sortKey, label
                    ) AS ChartData
                ) AS chartData;
        `;
        
        const [[results]] = await db.query(query);
        
        const chartDataArray = results.chartData ? JSON.parse(results.chartData) : [];

        res.json({
            totalOrders: results.totalOrders || 0,
            totalRevenue: results.totalRevenue || 0,
            newShops: results.newShops || 0, 
            chartData: chartDataArray,
        });

    } catch (error) {
        logger.error("Error fetching platform summary:", error);
        res.status(500).json({ error: "Failed to fetch platform summary" });
    }
});


/**
 * 🆕 POST /api/admin/report/top-shops
 * Fetches Top 10 Shops by Revenue for the period.
 */
router.post("/report/top-shops", async (req, res) => {
    const { period } = req.body; 
    const dateCondition = getDateCondition(period, 'o');
    
    try {
        const query = `
            SELECT
                ls.ShopName AS name, -- FIX: ShopName is in Laundry_Shops
                SUM(i.PayAmount) AS revenue
            FROM Invoices i
            JOIN Orders o ON i.OrderID = o.OrderID
            JOIN Laundry_Shops ls ON o.ShopID = ls.ShopID -- FIX: Use Laundry_Shops table name
            WHERE ${dateCondition}
                -- FIX: Use Invoice_Status table and correct column name (InvoiceStatus)
                AND (SELECT invs.InvoiceStatus FROM Invoice_Status invs WHERE invs.InvoiceID = i.InvoiceID ORDER BY invs.StatUpdateAt DESC LIMIT 1) = 'Paid'
            GROUP BY ls.ShopID, ls.ShopName
            ORDER BY revenue DESC
            LIMIT 10;
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        logger.error("Error fetching top shops:", error);
        res.status(500).json({ error: "Failed to fetch top shops" });
    }
});


/**
 * 🆕 POST /api/admin/report/order-status-breakdown
 * Fetches breakdown of all paid orders by their current status (latest entry in Order_Status).
 */
router.post("/report/order-status-breakdown", async (req, res) => {
    const { period } = req.body; 
    const dateCondition = getDateCondition(period, 'o');
    
    try {
        const query = `
            SELECT 
                t1.OrderStatus AS label, -- FIX: Use the OrderStatus column from Order_Status
                COUNT(o.OrderID) AS count
            FROM Orders o
            -- Find the LATEST status record for the order
            JOIN Order_Status t1 ON t1.OrderID = o.OrderID
            JOIN (
                SELECT 
                    OrderID, MAX(OrderUpdatedAt) as max_date
                FROM Order_Status
                GROUP BY OrderID
            ) t2 ON t1.OrderID = t2.OrderID AND t1.OrderUpdatedAt = t2.max_date
            
            JOIN Invoices i ON o.OrderID = i.OrderID -- Ensure only paid orders are counted
            WHERE ${dateCondition}
            -- FIX: Use Invoice_Status table and correct column name (InvoiceStatus)
            AND (SELECT invs.InvoiceStatus FROM Invoice_Status invs WHERE invs.InvoiceID = i.InvoiceID ORDER BY invs.StatUpdateAt DESC LIMIT 1) = 'Paid'
            GROUP BY t1.OrderStatus
            ORDER BY count DESC;
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        logger.error("Error fetching order status breakdown:", error);
        res.status(500).json({ error: "Failed to fetch order status breakdown" });
    }
});

export default router;