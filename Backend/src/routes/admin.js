// Backend/src/routes/admin.js

import express from "express";
import db, { runSystemBackup, BACKUP_DIR } from "../db.js";
// 🔑 UPDATED: Import logUserActivity alongside the default system logger
import logger, { logUserActivity } from "../utils/logger.js"; 
import fs from 'fs'; 
import path from 'path'; 

const router = express.Router();

// Helper function to dynamically generate SQL date condition
const getDateCondition = (period, alias = 'o') => {
    switch (period) {
        case 'Monthly':
            return `YEAR(${alias}.OrderCreatedAt) = YEAR(CURDATE()) AND MONTH(${alias}.OrderCreatedAt) = MONTH(CURDATE())`;
        case 'Yearly':
            return `YEAR(${alias}.OrderCreatedAt) = YEAR(CURDATE())`;
        case 'Weekly':
        default:
            return `YEARWEEK(${alias}.OrderCreatedAt, 1) = YEARWEEK(CURDATE(), 1)`;
    }
};

const getShopDateCondition = (period, alias = 'ls') => {
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
// 1. System Settings Routes
// =======================================================

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

router.post('/config/set-maintenance', async (req, res) => {
    const { enable, userId } = req.body; // Added userId for logging
    const value = enable ? 'true' : 'false';

    try {
        await db.query(`
            INSERT INTO SystemConfig (ConfigKey, ConfigValue)
            VALUES ('MAINTENANCE_MODE', ?)
            ON DUPLICATE KEY UPDATE ConfigValue = ?`, [value, value]);

        // 💡 LOG: Maintenance Mode Toggle
        if (userId) {
            await logUserActivity(userId, 'Admin', 'System Config', `Maintenance mode set to: ${enable}`);
        }

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
// 2. Backup Routes (LOGGING ADDED)
// =======================================================

router.post('/backup/run', async (req, res) => {
    const { userId } = req.body; // 🔑 Expect userId from Frontend

    try {
        const backupFilePath = await runSystemBackup();
        const backupFileName = path.basename(backupFilePath);
        logger.info(`Database backup successful: ${backupFileName}`);
        
        // 💡 LOG: Backup Generation
        if (userId) {
            await logUserActivity(
                userId, 
                'Admin', 
                'Data Security', 
                `Generated system backup: ${backupFileName}`
            );
        }

        return res.status(200).json({ 
            message: 'Database backup completed successfully.',
            filename: backupFileName,
            downloadUrl: `/api/admin/backup/download?filename=${backupFileName}&userId=${userId || ''}` // Pass userId to download link
        });
    } catch (error) {
        logger.error(`Error running database backup: ${error.message}`);
        return res.status(500).json({ 
            message: 'Failed to run database backup. Check server logs.',
            error: error.message 
        });
    }
});

router.get('/backup/download', async (req, res) => {
    const { filename, userId } = req.query; // 🔑 Expect userId from Query Params

    if (!filename) return res.status(400).json({ message: 'Missing filename parameter.' });

    const filePath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(filePath) || !filePath.startsWith(BACKUP_DIR)) {
        logger.warn(`Attempted download of non-existent or invalid backup file: ${filename}`);
        return res.status(404).json({ message: 'Backup file not found.' });
    }

    // 💡 LOG: Backup Download
    // We do this before the stream starts
    if (userId) {
        try {
            await logUserActivity(
                userId, 
                'Admin', 
                'Data Security', 
                `Downloaded backup file: ${filename}`
            );
        } catch (logError) {
            console.error("Failed to log download activity:", logError);
            // Continue download even if logging fails
        }
    }

    res.setHeader('Content-disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-type', 'application/sql'); 

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
});

// =======================================================
// 3. Admin Reporting Routes (Metrics - Used by reports.php)
// =======================================================

router.post("/report/platform-summary", async (req, res) => {
    const { period = 'Weekly' } = req.body; 

    let groupBy, dateFormat, dateCondition;
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
                (SELECT COUNT(*) FROM Orders) AS totalOrders,
                
                (SELECT SUM(i.PayAmount) 
                    FROM Orders o 
                    JOIN Invoices i ON o.OrderID = i.OrderID
                    WHERE ${dateCondition} 
                    AND i.PaymentStatus = 'Paid'
                ) AS totalRevenue,

                (SELECT COUNT(ls.ShopID)
                    FROM Laundry_Shops ls 
                    WHERE ${shopDateCondition} 
                ) AS newShops,

                (SELECT CONCAT('[', 
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
                    AND i.PaymentStatus = 'Paid'
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
                AND i.PaymentStatus = 'Paid'
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

router.post("/report/order-status-breakdown", async (req, res) => {
    const { period } = req.body; 
    const dateCondition = getDateCondition(period, 'o');
    
    try {
        const query = `
            SELECT 
                t1.OrderStatus AS label, 
                COUNT(o.OrderID) AS count
            FROM Orders o
            JOIN Order_Status t1 ON t1.OrderID = o.OrderID
            JOIN (
                SELECT OrderID, MAX(OrderUpdatedAt) as max_date
                FROM Order_Status
                GROUP BY OrderID
            ) t2 ON t1.OrderID = t2.OrderID AND t1.OrderUpdatedAt = t2.max_date
            
            JOIN Invoices i ON o.OrderID = i.OrderID 
            WHERE ${dateCondition}
            AND i.PaymentStatus = 'Paid'
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

router.get("/analytics/growth-trend", async (req, res) => {
    try {
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

router.get("/analytics/service-gaps", async (req, res) => {
    try {
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