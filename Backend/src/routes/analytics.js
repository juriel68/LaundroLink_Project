import express from "express";
import db from "../db.js";

const router = express.Router();

/**
 * ======================================================
 * 1️⃣ DETAILED CUSTOMER SEGMENTS (For PHP dashboard)
 * Endpoint: GET /api/analytics/segment-details/:shopId
 * ======================================================
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
 * ======================================================
 * 2️⃣ POPULAR SERVICES
 * Endpoint: GET /api/analytics/popular-services/:shopId
 * ======================================================
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
 * ======================================================
 * 3️⃣ BUSIEST TIMES
 * Endpoint: GET /api/analytics/busiest-times/:shopId
 * ======================================================
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

export default router;
