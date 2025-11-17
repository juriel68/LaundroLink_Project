// Backend/src/routes/admin.js

import express from "express";
// Imports the default export (the pool) as 'db' and the named export (runSystemBackup).
import db, { runSystemBackup, BACKUP_DIR } from "../db.js";
// Imports the default export (systemLogger) from "../utils/logger.js".
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

// Helper function to dynamically generate Shop Date condition using the new Laundry_Shops.DateCreated
const getShopDateCondition = (period, alias = 'ls') => {
    // We now reference the Laundry_Shops.DateCreated column directly
    switch (period) {
        case 'Monthly':
            return `YEAR(${alias}.DateCreated) = YEAR(CURDATE()) AND MONTH(${alias}.DateCreated) = MONTH(CURDATE())`;
        case 'Yearly':
            return `YEAR(${alias}.DateCreated) = YEAR(CURDATE())`;
        case 'Weekly':
        default:
            return `YEARWEEK(${alias}.DateCreated, 1) = YEARWEEK(CURDATE(), 1)`;
    }
};

// =======================================================
// 1. System Settings Routes (config)
// =======================================================

/**
 * GET /api/admin/config/maintenance-status
 * Fetches the current maintenance mode status from the database.
 */
router.get('/config/maintenance-status', async (req, res) => {
    try {
        const [[config]] = await db.query("SELECT ConfigValue FROM SystemConfig WHERE ConfigKey = 'MAINTENANCE_MODE'");
        const isEnabled = config && config.ConfigValue === 'true';
        return res.status(200).json({ maintenanceMode: isEnabled });
    } catch (error) {
        logger.error(`Error fetching maintenance status: ${error.message}`);
        return res.status(500).json({ message: 'Failed to fetch system configuration.' });
    }
});

/**
 * POST /api/admin/config/set-maintenance
 * Sets the maintenance mode status in the database.
 * Expects body: { enable: boolean }
 */
router.post('/config/set-maintenance', async (req, res) => {
    const { enable } = req.body;
    const value = enable ? 'true' : 'false';

    try {
        await db.query(`
            INSERT INTO SystemConfig (ConfigKey, ConfigValue)
            VALUES ('MAINTENANCE_MODE', ?)
            ON DUPLICATE KEY UPDATE ConfigValue = ?`, [value, value]);

        return res.status(200).json({ 
            message: 'Maintenance mode updated.', 
            maintenanceMode: enable 
        });
    } catch (error) {
        logger.error(`Error setting maintenance status: ${error.message}`);
        return res.status(500).json({ message: 'Failed to update system configuration.' });
    }
});


// =======================================================
// 2. Backup Routes
// =======================================================

router.post('/backup/run', async (req, res) => {
    try {
        const backupFilePath = await runSystemBackup();
        const backupFileName = path.basename(backupFilePath);
        logger.info(`Database backup successful: ${backupFileName}`);
        
        return res.status(200).json({ 
            message: 'Database backup completed successfully.',
            filename: backupFileName,
            downloadUrl: `/api/admin/backup/download?filename=${backupFileName}`
        });
    } catch (error) {
        logger.error(`Error running database backup: ${error.message}`);
        return res.status(500).json({ 
            message: 'Failed to run database backup. Check server logs.',
            error: error.message 
        });
    }
});

/**
 * GET /api/admin/backup/download?filename=[name]
 * Streams the generated backup file to the client for download.
 */
router.get('/backup/download', (req, res) => {
    const { filename } = req.query;
    if (!filename) {
        return res.status(400).json({ message: 'Missing filename parameter.' });
    }

    const filePath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(filePath) || !filePath.startsWith(BACKUP_DIR)) {
        logger.warn(`Attempted download of non-existent or invalid backup file: ${filename}`);
        return res.status(404).json({ message: 'Backup file not found.' });
    }

    res.setHeader('Content-disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-type', 'application/sql'); 

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
});

// =======================================================
// 3. Admin Reporting Routes (Metrics - Used by reports.php)
// =======================================================

/**
 * POST /api/admin/report/platform-summary
 * Fetches platform-wide aggregated metrics (Revenue, Orders, New Shops, Growth Trend).
 */
router.post("/report/platform-summary", async (req, res) => {
    const { period = 'Weekly' } = req.body; 

    let groupBy, dateFormat, dateCondition;
    // Get the updated shop date condition
    const shopDateCondition = getShopDateCondition(period, 'ls');
    
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

    try {
        await db.query("SET SESSION group_concat_max_len = 1000000;");

        const query = `
            SELECT
                -- Total Orders 
                (SELECT COUNT(*) FROM Orders) AS totalOrders,
                
                -- Total Revenue (Paid Invoices only)
                (SELECT SUM(i.PayAmount) 
                    FROM Orders o 
                    JOIN Invoices i ON o.OrderID = i.OrderID
                    WHERE ${dateCondition} 
                    AND (SELECT invs.InvoiceStatus FROM Invoice_Status invs WHERE invs.InvoiceID = i.InvoiceID ORDER BY invs.StatUpdateAt DESC LIMIT 1) = 'Paid'
                ) AS totalRevenue,

                -- New Shops Onboarded (Count new shops using Laundry_Shops.DateCreated)
                (
                    SELECT COUNT(ls.ShopID)
                    FROM Laundry_Shops ls 
                    WHERE ${shopDateCondition} 
                ) AS newShops,

                -- Aggregate revenue trend data
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
 * POST /api/admin/report/top-shops
 * Fetches Top 10 Shops by Revenue for the period.
 */
router.post("/report/top-shops", async (req, res) => {
    const { period } = req.body; 
    const dateCondition = getDateCondition(period, 'o');
    
    try {
        const query = `
            SELECT
                ls.ShopName AS name, 
                SUM(i.PayAmount) AS revenue
            FROM Invoices i
            JOIN Orders o ON i.OrderID = o.OrderID
            JOIN Laundry_Shops ls ON o.ShopID = ls.ShopID 
            WHERE ${dateCondition}
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
 * POST /api/admin/report/order-status-breakdown
 * Fetches breakdown of all paid orders by their current status (latest entry in Order_Status).
 */
router.post("/report/order-status-breakdown", async (req, res) => {
    const { period } = req.body; 
    const dateCondition = getDateCondition(period, 'o');
    
    try {
        const query = `
            SELECT 
                t1.OrderStatus AS label, 
                COUNT(o.OrderID) AS count
            FROM Orders o
            -- Finds the latest status record for the order
            JOIN Order_Status t1 ON t1.OrderID = o.OrderID
            JOIN (
                SELECT 
                    OrderID, MAX(OrderUpdatedAt) as max_date
                FROM Order_Status
                GROUP BY OrderID
            ) t2 ON t1.OrderID = t2.OrderID AND t1.OrderUpdatedAt = t2.max_date
            
            JOIN Invoices i ON o.OrderID = i.OrderID -- Ensure only paid orders are counted
            WHERE ${dateCondition}
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


// =======================================================
// 4. Admin Analytics Routes (Insights - Used by analytics.php)
// =======================================================

/**
 * GET /api/admin/analytics/growth-trend
 * Fetches platform growth metrics (Revenue, New Shops) from the aggregated table.
 */
router.get("/analytics/growth-trend", async (req, res) => {
    try {
        // Fetches all historical data from the Python-populated table
        const query = `
            SELECT 
                MonthYear AS label, 
                MonthlyRevenue AS revenue, 
                NewShops
            FROM Platform_Growth_Metrics 
            ORDER BY MonthYear DESC;
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        logger.error("Error fetching platform growth trend:", error);
        res.status(500).json({ error: "Failed to fetch platform growth trend" });
    }
});

/**
 * GET /api/admin/analytics/service-gaps
 * Fetches the Service Gap Analysis data (Demand vs. Supply).
 * Identifies high-demand services not widely offered.
 */
router.get("/analytics/service-gaps", async (req, res) => {
    try {
        // Fetches the top services with the highest GapScore (highest demand vs. lowest supply)
        const query = `
            SELECT 
                SvcName, 
                PlatformOrderCount, 
                OfferingShopCount, 
                GapScore
            FROM Service_Gap_Analysis 
            ORDER BY GapScore DESC
            LIMIT 10;
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        logger.error("Error fetching service gap analysis:", error);
        res.status(500).json({ error: "Failed to fetch service gap analysis" });
    }
});

export default router;