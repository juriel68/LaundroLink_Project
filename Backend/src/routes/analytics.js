import express from "express";
import db from "../db.js";

const router = express.Router();

// GET /api/analytics/segments/:shopId
// Fetches the count of customers in each segment for a specific laundry shop.
router.get("/segments/:shopId", async (req, res) => {
    const { shopId } = req.params;

    if (!shopId) {
        return res.status(400).json({ error: "Shop ID is required." });
    }

    try {
        const query = `
            SELECT 
                cs.SegmentName,
                COUNT(DISTINCT c.CustID) as customerCount
            FROM Customer_Segments cs
            JOIN Customer c ON cs.CustID = c.CustID
            JOIN Orders o ON c.CustID = o.CustID
            WHERE o.ShopID = ?
            GROUP BY cs.SegmentName
            ORDER BY customerCount DESC;
        `;
        
        const [segments] = await db.query(query, [shopId]);
        
        res.json(segments);

    } catch (error) {
        console.error("Error fetching customer segments:", error);
        res.status(500).json({ error: "Failed to fetch customer segments." });
    }
});

// GET /api/analytics/popular-services/:shopId
// Fetches the most popular services for a given shop
router.get("/popular-services/:shopId", async (req, res) => {
    const { shopId } = req.params;
    if (!shopId) {
        return res.status(400).json({ error: "Shop ID is required." });
    }
    try {
        const query = `
            SELECT 
                s.SvcName,
                COUNT(o.OrderID) as orderCount
            FROM Orders o
            JOIN Service s ON o.SvcID = s.SvcID
            WHERE o.ShopID = ?
            GROUP BY s.SvcName
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

export default router;