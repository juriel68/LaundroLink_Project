import express from "express";
import db from "../db.js";

const router = express.Router();

// GET /api/shops/:shopId/details
// Fetches shop details and its average rating.
router.get("/:shopId/details", async (req, res) => {
    const { shopId } = req.params;
    const connection = await db.getConnection();

    try {
        const [
            [[shopDetails]], // Get the first object from the result array
            [[ratingSummary]]  // Get the first object from the result array
        ] = await Promise.all([
            // Query 1: Get basic shop info
            connection.query(`SELECT * FROM Laundry_Shops WHERE ShopID = ?`, [shopId]),
            
            // Query 2: Get the average rating and total count of ratings
            connection.query(
                `SELECT 
                    AVG(cr.CustRating) as averageRating, 
                    COUNT(cr.CustRateID) as ratingCount
                 FROM Customer_Ratings cr 
                 JOIN Orders o ON cr.OrderID = o.OrderID 
                 WHERE o.ShopID = ?`,
                [shopId]
            )
        ]);

        if (!shopDetails) {
            return res.status(404).json({ error: "Shop not found." });
        }

        // Combine results into a single response
        res.json({
            details: shopDetails,
            rating: ratingSummary
        });

    } catch (error) {
        console.error("Error fetching shop details:", error);
        res.status(500).json({ error: "Failed to fetch shop details." });
    } finally {
        connection.release();
    }
});

// PUT /api/shops/:shopId
// Updates the details of a specific shop
router.put("/:shopId", async (req, res) => {
    const { shopId } = req.params;
    const { ShopName, ShopDescrp, ShopAddress, ShopPhone, ShopOpeningHours, ShopStatus } = req.body;
    try {
        const [result] = await db.query(
            `UPDATE Laundry_Shops SET 
                ShopName = ?, ShopDescrp = ?, ShopAddress = ?, 
                ShopPhone = ?, ShopOpeningHours = ?, ShopStatus = ?
            WHERE ShopID = ?`,
            [ShopName, ShopDescrp, ShopAddress, ShopPhone, ShopOpeningHours, ShopStatus, shopId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Shop not found." });
        }
        res.json({ success: true, message: "Shop details updated successfully." });
    } catch (error) {
        console.error("Error updating shop:", error);
        res.status(500).json({ error: "Failed to update shop details." });
    }
});

export default router;