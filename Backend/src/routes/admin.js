// Backend/src/routes/admin.js

import express from "express";
// Imports the default export (the pool) as 'db' and the named export (runSystemBackup).
import db, { runSystemBackup } from "../db.js"; 
// Imports the default export (systemLogger) from the utils folder.
import logger from "../utils/logger.js"; 
import { Parser } from 'json2csv'; 
import fs from 'fs'; 
import path from 'path'; 

const router = express.Router();

// =======================================================
// 1. System Settings Routes (config)
// =======================================================

/**
 * ✅ GET /api/admin/config/maintenance-status
 * Fetches the current maintenance mode status from the database.
 */
router.get('/config/maintenance-status', async (req, res) => {
    try {
        // Find the configuration key for maintenance mode
        const [[config]] = await db.query("SELECT ConfigValue FROM SystemConfig WHERE ConfigKey = 'MAINTENANCE_MODE'");
        
        // Default to false if the configuration key doesn't exist
        const isEnabled = config && config.ConfigValue === 'true';

        return res.status(200).json({ maintenanceMode: isEnabled });
    } catch (error) {
        logger.error(`Error fetching maintenance status: ${error.message}`);
        return res.status(500).json({ message: 'Failed to fetch system configuration.' });
    }
});

/**
 * ✅ POST /api/admin/config/set-maintenance
 * Sets the maintenance mode status in the database.
 * Expects body: { enable: boolean }
 */
router.post('/config/set-maintenance', async (req, res) => {
    const { enable } = req.body;
    const value = enable ? 'true' : 'false';

    try {
        // Use UPSERT (INSERT OR UPDATE) to handle configuration key creation/modification
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
// 2. Reports Routes (reports/download)
// =======================================================

/**
 * ✅ GET /api/admin/reports/download?type={daily|monthly}
 * Generates and downloads a system report (CSV).
 */
router.get('/reports/download', async (req, res) => {
    const reportType = req.query.type;
    // Format today's date (e.g., '2025-10-27')
    const today = new Date().toISOString().split('T')[0]; 
    let reportData = [];
    let filename;
    
    try {
        if (reportType === 'daily') {
            // **CORRECTED QUERY for Daily Report**
            // FIX: CAST PayAmount to CHAR to ensure the database returns a plain string, 
            // preventing the CSV file from showing Buffer data for decimal values.
            reportData = await db.query(`
                SELECT 
                    s.ShopName, 
                    c.CustName AS CustomerName,
                    CAST(inv.PayAmount AS CHAR) AS Amount,
                    ist.PaidAt AS DateCompleted,
                    ist.InvoiceStatus AS Status
                FROM Orders o
                JOIN Customers c ON o.CustID = c.CustID
                JOIN Laundry_Shops s ON o.ShopID = s.ShopID
                JOIN Invoices inv ON o.OrderID = inv.OrderID
                JOIN Invoice_Status ist ON inv.InvoiceID = ist.InvoiceID
                WHERE DATE(ist.PaidAt) = ? AND ist.InvoiceStatus = 'Paid'`, [today]);
            
            filename = `daily_report_${today}.csv`;

        } else if (reportType === 'monthly') {
            // **CORRECTED QUERY for Monthly Report**
            // FIX: CAST SUM(inv.PayAmount) to CHAR to ensure the aggregated total revenue 
            // is returned as a plain string, preventing Buffer data in the CSV.
            const startOfMonth = new Date(today.substring(0, 7) + '-01').toISOString().split('T')[0];
            
            reportData = await db.query(`
                SELECT 
                    s.ShopName, 
                    COUNT(o.OrderID) as TotalOrders, 
                    CAST(SUM(inv.PayAmount) AS CHAR) as TotalRevenue
                FROM Orders o
                JOIN Laundry_Shops s ON o.ShopID = s.ShopID
                JOIN Invoices inv ON o.OrderID = inv.OrderID
                JOIN Invoice_Status ist ON inv.InvoiceID = ist.InvoiceID
                WHERE ist.PaidAt >= ? AND ist.InvoiceStatus = 'Paid'
                GROUP BY s.ShopName`, [startOfMonth]);

            filename = `monthly_report_${today.substring(0, 7)}.csv`;

        } else {
            return res.status(400).json({ message: 'Invalid report type specified.' });
        }

        if (reportData.length === 0) {
            return res.status(404).json({ message: `No data found to generate the ${reportType} report.` });
        }
        
        // Convert JSON data to CSV
        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(reportData);

        // Send the CSV file as a download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.status(200).send(csv);

    } catch (error) {
        logger.error(`Report generation error (${reportType}): ${error.message}`);
        return res.status(500).json({ 
            message: `Failed to generate ${reportType} report.`, 
            error: error.message 
        });
    }
});


// =======================================================
// 3. Data Security Route (data-security/backup)
// =======================================================

/**
 * ✅ POST /api/admin/data-security/backup
 * Triggers a full database backup using the utility function.
 */
router.post('/data-security/backup', async (req, res) => {
    try {
        // 1. Define Backup Parameters
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `laundrolink_backup_${timestamp}.sql`; 
        
        // Calculate path to a 'backups' folder outside of the 'src' directory
        // In a deployed environment, ensure this path is writable and secure.
        const backupPath = path.join(path.dirname(new URL(import.meta.url).pathname), '..', '..', 'backups', filename); 
        
        // Ensure the backups directory exists
        if (!fs.existsSync(path.dirname(backupPath))) {
            fs.mkdirSync(path.dirname(backupPath), { recursive: true });
        }

        // 2. Execute the Database Backup Command using the named import
        const success = await runSystemBackup(backupPath); 
        
        if (!success) {
             throw new Error("Database backup command failed to execute.");
        }

        logger.info(`Database backup successful: ${filename}`);
        return res.status(200).json({ 
            message: 'System backup completed.', 
            filename: filename 
        });

    } catch (error) {
        logger.error(`Backup process error: ${error.message}`);
        return res.status(500).json({ 
            message: 'Failed to complete system backup.', 
            error: error.message 
        });
    }
});


export default router;