// routes/shops.js

import express from "express";
import db from "../db.js";

const router = express.Router();

// =================================================================
// SHOP ROUTES
// =================================================================

/**
 * Helper function to create the base SELECT clause for shop data.
 * This ensures consistency and DRY principle across shop routes.
 * @param {boolean} includeDistance - Whether to include the Haversine distance calculation coordinates.
 * @returns {string} The SELECT clause.
 */
const getShopSelectClause = (includeDistance = false) => {
    // 🎯 CHANGE APPLIED: Removed the 'addDescription' placeholder field
    return `
        LS.ShopID as id,
        LS.ShopName as name,
        LS.ShopAddress as address,
        LS.ShopDescrp as description,
        LS.ShopImage_url as image_url,
        LS.ShopPhone as contact,
        LS.ShopOpeningHours as hours,
        LS.ShopStatus as availability,
        COALESCE(AVG(CR.CustRating), 0.0) AS rating
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
                ${getShopSelectClause(false)},
                -- Distance is not calculated here, so it's NULL
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
// Fetches a list of shops near a given latitude and longitude (for Homepage.tsx)
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
                ${getShopSelectClause(true)},
                -- Calculate distance using Shop_Distance coordinates
                ( 6371 * acos( cos( radians(?) ) * cos( radians( SD.ShopLatitude ) ) * cos( radians( SD.ShopLongitude ) - radians(?) ) + sin( radians(?) ) * sin( radians( SD.ShopLatitude ) ) ) ) AS distance
            FROM 
                Laundry_Shops AS LS
            -- REQUIRED: Join Shop_Distance to get location coordinates
            INNER JOIN
                Shop_Distance AS SD ON LS.ShopID = SD.ShopID
            -- REQUIRED: Join Orders and Customer_Ratings to get the average rating
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

router.get("/:shopId/full-details", async (req, res) => {
    const { shopId } = req.params;
    const connection = await db.getConnection();

    try {
        const [
            // Query 1: Get basic shop info and average rating
            [[shopDetails]],
            // Query 2: Get shop services with price and load info
            services,
            // Query 3: Get shop add-ons
            addOns
        ] = await Promise.all([
            // 1. Fetch shop details & rating
            connection.query(
                `SELECT 
                    LS.ShopID as id,
                    LS.ShopName as name,
                    LS.ShopDescrp as description,
                    LS.ShopAddress as address,
                    LS.ShopPhone as contact,
                    LS.ShopOpeningHours as hours,
                    LS.ShopStatus as availability,
                    LS.ShopImage_url as image,
                    COALESCE(AVG(CR.CustRating), 0.0) AS rating
                FROM Laundry_Shops AS LS
                LEFT JOIN Orders AS O ON LS.ShopID = O.ShopID
                LEFT JOIN Customer_Ratings AS CR ON O.OrderID = CR.OrderID
                WHERE LS.ShopID = ?
                GROUP BY LS.ShopID`,
                [shopId]
            ),
            
            // 2. Fetch services
            connection.query(
                `SELECT 
                    S.SvcName as name,
                    SS.SvcPrice as price,
                    SS.MinLoad as minLoad,
                    SS.MaxLoad as maxLoad
                FROM Shop_Services AS SS
                JOIN Services AS S ON SS.SvcID = S.SvcID
                WHERE SS.ShopID = ?
                ORDER BY S.SvcName`,
                [shopId]
            ),

            // 3. Fetch add-ons
             connection.query(
                `SELECT
                    AddOnName as name,
                    AddOnPrice as price
                FROM Add_Ons
                WHERE ShopID = ?
                ORDER BY AddOnName`,
                [shopId]
            )
        ]);

        if (!shopDetails) {
            return res.status(404).json({ error: "Shop not found." });
        }

        // Combine results into a single response
        res.json({
            success: true,
            shop: {
                ...shopDetails,
                // Format rating to one decimal place
                rating: parseFloat(shopDetails.rating).toFixed(1) 
            },
            services: services[0], // services[0] contains the array of results
            addOns: addOns[0]      // addOns[0] contains the array of results
        });

    } catch (error) {
        console.error("Error fetching full shop details:", error);
        res.status(500).json({ success: false, error: "Failed to fetch shop details." });
    } finally {
        connection.release();
    }
});


// PUT /api/shops/:shopId (No change needed here)
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