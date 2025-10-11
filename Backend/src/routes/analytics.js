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

// GET /api/analytics/busiest-times/:shopId
// Fetches the number of orders per time slot for a given shop
router.get("/busiest-times/:shopId", async (req, res) => {
    const { shopId } = req.params;
    if (!shopId) {
        return res.status(400).json({ error: "Shop ID is required." });
    }
    try {
        const query = `
            SELECT 
                CASE
                    WHEN HOUR(OrderCreatedAt) BETWEEN 7 AND 11 THEN 'Morning (7am-12pm)'
                    WHEN HOUR(OrderCreatedAt) BETWEEN 12 AND 16 THEN 'Afternoon (12pm-5pm)'
                    ELSE 'Evening (5pm onwards)'
                END as timeSlot,
                COUNT(OrderID) as orderCount
            FROM Orders
            WHERE ShopID = ?
            GROUP BY timeSlot
            ORDER BY FIELD(timeSlot, 'Morning (7am-12pm)', 'Afternoon (12pm-5pm)', 'Evening (5pm onwards)');
        `;
        const [results] = await db.query(query, [shopId]);
        res.json(results);
    } catch (error) {
        console.error("Error fetching busiest times:", error);
        res.status(500).json({ error: "Failed to fetch busiest times." });
    }
});

// GET /api/analytics/segment-details/:shopId
// Fetches detailed metrics for each customer segment for a specific shop
router.get("/segment-details/:shopId", async (req, res) => {
    const { shopId } = req.params;
    if (!shopId) {
        return res.status(400).json({ error: "Shop ID is required." });
    }

    try {
        const query = `
            WITH ShopCustomers AS (
                SELECT DISTINCT CustID FROM Orders WHERE ShopID = ?
            )
            SELECT 
                cs.SegmentName,
                COUNT(sc.CustID) AS customerCount,
                AVG(Stats.total_spent) AS averageSpend,
                AVG(Stats.order_frequency) AS averageFrequency,
                AVG(Stats.days_since_last_order) AS averageRecency
            FROM Customer_Segments cs
            JOIN ShopCustomers sc ON cs.CustID = sc.CustID
            JOIN (
                SELECT
                    c.CustID,
                    COUNT(DISTINCT o.OrderID) AS order_frequency,
                    SUM(i.PayAmount) AS total_spent,
                    DATEDIFF(NOW(), MAX(o.OrderCreatedAt)) as days_since_last_order
                FROM Customer c
                JOIN Orders o ON c.CustID = o.CustID
                JOIN Invoice i ON o.OrderID = i.OrderID
                WHERE i.InvoiceID IN (SELECT InvoiceID FROM Invoice_Status WHERE InvoiceStatus = 'Paid')
                GROUP BY c.CustID
            ) AS Stats ON cs.CustID = Stats.CustID
            GROUP BY cs.SegmentName
            ORDER BY averageSpend DESC;
        `;
        
        const [segments] = await db.query(query, [shopId]);
        res.json(segments);

    } catch (error) {
        console.error("Error fetching segment details:", error);
        res.status(500).json({ error: "Failed to fetch segment details." });
    }
});

export default router;