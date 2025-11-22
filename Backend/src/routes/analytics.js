// Backend/src/routes/analytics.js

import express from "express";
import db from "../db.js";

const router = express.Router();

/**
 * ======================================================
 * SHOP OWNER ANALYTICS ROUTES (Existing)
 * ======================================================
 */

/**
 * 1️⃣ DETAILED CUSTOMER SEGMENTS
 * Endpoint: GET /api/analytics/segment-details/:shopId
 */
router.get("/segment-details/:shopId", async (req, res) => {
    const { shopId } = req.params;
    if (!shopId) return res.status(400).json({ error: "Shop ID is required." });

    try {
        const query = `
            SELECT 
                SegmentName,
                customerCount,
                averageSpend,
                averageFrequency,
                averageRecency
            FROM Customer_Segments
            WHERE ShopID = ?
            ORDER BY customerCount DESC;
        `;
        const [segments] = await db.query(query, [shopId]);
        res.json(segments);
    } catch (error) {
        console.error("Error fetching segment details:", error);
        res.status(500).json({ error: "Failed to fetch segment details." });
    }
});

/**
 * 2️⃣ POPULAR SERVICES
 * Endpoint: GET /api/analytics/popular-services/:shopId
 */
router.get("/popular-services/:shopId", async (req, res) => {
    const { shopId } = req.params;
    if (!shopId) return res.status(400).json({ error: "Shop ID is required." });

    try {
        const query = `
            SELECT 
                SvcName,
                orderCount
            FROM Shop_Popular_Services
            WHERE ShopID = ?
            ORDER BY orderCount DESC
            LIMIT 5;
        `;
        const [services] = await db.query(query, [shopId]);
        res.json(services);
    } catch (error) {
        console.error("Error fetching popular services:", error);
        res.status(500).json({ error: "Failed to fetch popular services." });
    }
});


/**
 * 3️⃣ BUSIEST TIMES
 * Endpoint: GET /api/analytics/busiest-times/:shopId
 */
router.get("/busiest-times/:shopId", async (req, res) => {
    const { shopId } = req.params;
    if (!shopId) return res.status(400).json({ error: "Shop ID is required." });

    try {
        const query = `
            SELECT 
                timeSlot, 
                orderCount
            FROM Shop_Busiest_Times
            WHERE ShopID = ?
            ORDER BY FIELD(timeSlot, 'Morning (7am-12pm)', 'Afternoon (12pm-5pm)', 'Evening (5pm onwards)');
        `;
        const [results] = await db.query(query, [shopId]);
        res.json(results);
    } catch (error) {
        console.error("Error fetching busiest times:", error);
        res.status(500).json({ error: "Failed to fetch busiest times." });
    }
});

/**
 * ======================================================
 * 4️⃣ ADMIN DASHBOARD - SYSTEM-WIDE KPIs
 * Endpoint: GET /api/analytics/admin-dashboard-stats
 * Fetches pre-calculated data from the Python script.
 * ======================================================
 */
router.get("/admin-dashboard-stats", async (req, res) => {
    try {
        // 1. Fetch Key Performance Indicators (KPIs)
        const kpiQuery = `
            -- Fetch the single row of KPI data (MetricID=1)
            SELECT totalOwners, activeShops, totalPaymentsProcessed, totalSystemUsers
            FROM Admin_Growth_Metrics
            WHERE MetricID = 1; 
        `;
        const [kpiResults] = await db.query(kpiQuery); 
        const kpiData = kpiResults[0] || {}; 

        // 2. Fetch Monthly Growth Data for the Chart (System Growth)
        const growthQuery = `
            SELECT 
                MonthYear as label, 
                (NewUsers + NewOwners) as value 
            FROM Admin_Monthly_Growth
            ORDER BY MonthYear;
        `;
        const [chartData] = await db.query(growthQuery);
        
        // Combine and Send Response
        res.json({
            totalOwners: kpiData.totalOwners || 0,
            totalUsers: kpiData.totalSystemUsers || 0, 
            activeShops: kpiData.activeShops || 0,
            totalPayments: kpiData.totalPaymentsProcessed || 0, 
            chartData: chartData || [] // Ensure it's an array
        });

    } catch (error) {
        console.error("Error fetching admin dashboard stats:", error);
        res.status(500).json({ error: "Failed to fetch admin stats" });
    }
});


export default router;