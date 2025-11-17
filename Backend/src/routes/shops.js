// shops.js (MODIFIED to fix owner endpoint aliases)

import express from "express";
import db from "../db.js";

const router = express.Router();

// =================================================================
// SHOP ROUTES
// =================================================================

/**
 * Helper function to create the base SELECT clause for shop data.
 * NOTE: Uses PascalCase aliases matching the frontend form/display elements.
 */
const getShopSelectClause = (includeDistance = false) => {
    return `
        LS.ShopID as ShopID,
        LS.ShopName as ShopName,
        LS.ShopAddress as ShopAddress,
        LS.ShopDescrp as ShopDescrp,
        LS.ShopImage_url as ShopImage_url,
        LS.ShopPhone as ShopPhone,
        LS.ShopOpeningHours as ShopOpeningHours,
        LS.ShopStatus as ShopStatus,
        COALESCE(AVG(SR.ShopRating), 0.0) AS averageRating
        ${includeDistance ? ', SD.ShopLatitude, SD.ShopLongitude' : ''}
    `;
};


// GET /api/shops/
// Fetches a list of all laundry shops for the homepage (no specific location)
router.get("/", async (req, res) => {
    const connection = await db.getConnection();
    try {
        const [shops] = await connection.query(`
            SELECT
                LS.ShopID as id,
                LS.ShopName as name,
                LS.ShopAddress as address,
                LS.ShopDescrp as description,
                LS.ShopImage_url as image_url,
                LS.ShopPhone as contact,
                LS.ShopOpeningHours as hours,
                LS.ShopStatus as availability,
                COALESCE(AVG(CR.CustRating), 0.0) AS rating,
                NULL AS distance
            FROM
                Laundry_Shops AS LS
            LEFT JOIN
                Orders AS O ON LS.ShopID = O.ShopID
            LEFT JOIN
                Customer_Ratings AS CR ON O.OrderID = CR.OrderID
            GROUP BY
                LS.ShopID
            ORDER BY
                LS.ShopName;
        `);

        res.json({ shops });

    } catch (error) {
        console.error("Error fetching all shops:", error);
        res.status(500).json({ error: "Failed to fetch shop list." });
    } finally {
        connection.release();
    }
});

// GET /api/shops/nearby
router.get("/nearby", async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { lat, lon } = req.query;
        if (!lat || !lon) {
            return res.status(400).json({ success: false, message: "Latitude and longitude are required." });
        }
        
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        const maxDistanceKm = 10; // Search radius

        const query = `
            SELECT 
                ${getShopSelectClause(true).replace(/LS\./g, 'LS.').replace(/SR\.ShopRating/g, 'CR.CustRating')},
                -- Calculate distance using Shop_Distance coordinates
                ( 6371 * acos( cos( radians(?) ) * cos( radians( SD.ShopLatitude ) ) * cos( radians( SD.ShopLongitude ) - radians(?) ) + sin( radians(?) ) * sin( radians( SD.ShopLatitude ) ) ) ) AS distance
            FROM 
                Laundry_Shops AS LS
            INNER JOIN
                Shop_Distance AS SD ON LS.ShopID = SD.ShopID
            LEFT JOIN
                Orders AS O ON LS.ShopID = O.ShopID
            LEFT JOIN
                Customer_Ratings AS CR ON O.OrderID = CR.OrderID
            GROUP BY
                LS.ShopID, SD.ShopLatitude, SD.ShopLongitude
            HAVING distance < ?
            ORDER BY distance
            LIMIT 20;
        `;
        const [shops] = await connection.query(query, [latitude, longitude, latitude, maxDistanceKm]);
        
        res.json({ success: true, shops });
    } catch (error) {
        console.error("❌ Get nearby shops error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch nearby shops." });
    } finally {
        connection.release();
    }
});


/**
 * 🔑 NEW ENDPOINT for Shop Owner Dashboard: /shops/:shopId/full-details-owner
 * Fetches all data required for the manage_shop.php dashboard.
 */
router.get("/:shopId/full-details-owner", async (req, res) => {
    const { shopId } = req.params;
    const connection = await db.getConnection();

    try {
        const [
            // Query 1: Get basic shop info and average rating
            [[shopDetails]],
            // Query 2: Get all ratings to calculate breakdown
            allRatings
        ] = await Promise.all([
            // 1. Fetch shop details & AVG rating
            connection.query(
                `SELECT 
                    LS.ShopID,
                    LS.ShopName,
                    LS.ShopDescrp,
                    LS.ShopAddress,
                    LS.ShopPhone,
                    LS.ShopOpeningHours,
                    LS.ShopStatus,
                    COALESCE(AVG(SR.ShopRating), 0.0) AS averageRating
                FROM Laundry_Shops AS LS
                LEFT JOIN Shop_Rates AS SR ON LS.ShopID = SR.ShopID
                WHERE LS.ShopID = ?
                GROUP BY LS.ShopID`,
                [shopId]
            ),
            
            // 2. Fetch all raw ratings for breakdown calculation
            connection.query(
                `SELECT ShopRating 
                 FROM Shop_Rates 
                 WHERE ShopID = ?`,
                [shopId]
            )
        ]);
        
        if (!shopDetails) {
            return res.status(404).json({ error: "Shop not found." });
        }
        
        // --- RATING BREAKDOWN CALCULATION ---
        const ratingsArray = allRatings[0].map(r => r.ShopRating);
        const ratingCount = ratingsArray.length;
        const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        
        ratingsArray.forEach(rating => {
            const roundedRating = Math.round(rating);
            if (breakdown[roundedRating] !== undefined) {
                breakdown[roundedRating]++;
            }
        });

        // Combine results into the exact structure the frontend expects
        res.json({
            success: true,
            details: {
                ShopName: shopDetails.ShopName,
                ShopDescrp: shopDetails.ShopDescrp,
                ShopAddress: shopDetails.ShopAddress,
                ShopPhone: shopDetails.ShopPhone,
                ShopOpeningHours: shopDetails.ShopOpeningHours,
                ShopStatus: shopDetails.ShopStatus,
            },
            rating: {
                averageRating: shopDetails.averageRating,
                ratingCount: ratingCount,
                breakdown: breakdown 
            }
        });

    } catch (error) {
        console.error("Error fetching shop owner details:", error);
        res.status(500).json({ success: false, error: "Failed to fetch shop details." });
    } finally {
        connection.release();
    }
});


// PUT /api/shops/:shopId (Update Shop Details)
router.put("/:shopId", async (req, res) => {
    const { shopId } = req.params;
    const { ShopName, ShopDescrp, ShopAddress, ShopPhone, ShopOpeningHours, ShopStatus } = req.body;
    const connection = await db.getConnection();
    
    try {
        const [result] = await connection.query(
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
    } finally {
        connection.release();
    }
});

export default router;