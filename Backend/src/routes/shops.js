// shops.js (Full Code - FINALIZED FOR NORMALIZED SCHEMA)

import express from "express";
import db from "../db.js";

const router = express.Router();

// =================================================================
// HELPER FUNCTIONS: ID Generation
// =================================================================

const generateNextID = async (connection, table, prefix, idColumn) => {
    const [rows] = await connection.query(
        `SELECT ${idColumn} AS last_id 
         FROM ${table} 
         WHERE ${idColumn} LIKE '${prefix}%'
         ORDER BY LENGTH(${idColumn}) DESC, ${idColumn} DESC
         LIMIT 1`
    );

    let nextNumber = 1;
    if (rows.length > 0) {
        const lastID = rows[0].last_id;
        const numberPart = parseInt(lastID.substring(prefix.length)) || 0;
        nextNumber = numberPart + 1;
    }

    const paddedNumber = nextNumber.toString().padStart(2, '0');
    return `${prefix}${paddedNumber}`;
};

const generateNewShopID = async (connection) => {
    return await generateNextID(connection, 'Laundry_Shops', 'SH', 'ShopID');
};


// =================================================================
// SHOP ROUTES (Public & Management)
// =================================================================

const getShopSelectClause = (includeDistance = false) => {
    // NOTE: This helper is now redundant due to explicit aliasing in /nearby and /full-details,
    // but is kept here for reference consistency.
    return `
        LS.ShopID as id,
        LS.ShopName as name,
        LS.ShopAddress as address,
        LS.ShopDescrp as description,
        LS.ShopImage_url as image_url,
        LS.ShopPhone as contact,
        LS.ShopOpeningHours as hours,
        LS.ShopStatus as availability,
        SR.ShopRating AS rating
        ${includeDistance ? ', SD.ShopLatitude, SD.ShopLongitude' : ''}
    `;
};


// GET /api/shops/ (Public listing)
router.get("/", async (req, res) => {
    const connection = await db.getConnection();
    try {
        const [shops] = await connection.query(`
            SELECT
                LS.ShopID as id, LS.ShopName as name, LS.ShopAddress as address, 
                LS.ShopDescrp as description, LS.ShopImage_url as image_url, 
                LS.ShopPhone as contact, LS.ShopOpeningHours as hours, 
                LS.ShopStatus as availability,
                SR.ShopRating AS rating,
                NULL AS distance
            FROM Laundry_Shops AS LS
            LEFT JOIN Shop_Rates AS SR ON LS.ShopID = SR.ShopID
            GROUP BY LS.ShopID
            ORDER BY LS.ShopName;
        `);
        res.json({ shops });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch shop list." });
    } finally {
        connection.release();
    }
});

// GET /api/shops/nearby (Mobile App Listing)
router.get("/nearby", async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { lat, lon } = req.query;
        if (!lat || !lon) {
            return res.status(400).json({ success: false, message: "Latitude and longitude are required." });
        }
        
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        const maxDistanceKm = 100; // Testing radius

        const query = `
            SELECT 
                -- 🔑 FORCE CORRECT ALIASES FOR MOBILE APP
                LS.ShopID as id, 
                LS.ShopName as name, 
                LS.ShopAddress as address, 
                LS.ShopDescrp as description, 
                LS.ShopImage_url as image_url, 
                LS.ShopPhone as contact, 
                LS.ShopOpeningHours as hours, 
                LS.ShopStatus as availability,
                COALESCE(SR.ShopRating, 0.0) AS rating,
                SD.ShopLatitude, 
                SD.ShopLongitude,
                
                -- Distance Calculation
                ( 6371 * acos( cos( radians(?) ) * cos( radians( SD.ShopLatitude ) ) * cos( radians( SD.ShopLongitude ) - radians(?) ) + sin( radians(?) ) * sin( radians( SD.ShopLatitude ) ) ) ) AS distance
            FROM 
                Laundry_Shops AS LS
            INNER JOIN
                Shop_Distance AS SD ON LS.ShopID = SD.ShopID
            LEFT JOIN
                Shop_Rates AS SR ON LS.ShopID = SR.ShopID 
            WHERE
                SD.ShopLatitude IS NOT NULL AND SD.ShopLongitude IS NOT NULL
            GROUP BY
                LS.ShopID
            HAVING distance < ?
            ORDER BY distance
            LIMIT 20;
        `;
        const [shops] = await connection.query(query, [latitude, longitude, latitude, maxDistanceKm]);
        
        res.json({ success: true, shops });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch nearby shops." });
    } finally {
        connection.release();
    }
});

// GET /api/shops/:shopId/full-details (Customer App)
router.get("/:shopId/full-details", async (req, res) => {
    const { shopId } = req.params;
    const connection = await db.getConnection();

    try {
        const [
            [[shopDetails]], 
            services,
            addOns,
            deliveryOptions,
            fabricTypes,
        ] = await Promise.all([
            // 1. Basic Shop Details - RATING SOURCED DIRECTLY
            connection.query(
                `SELECT 
                    LS.ShopID as id, LS.ShopName as name, LS.ShopAddress as address, 
                    LS.ShopDescrp as description, LS.ShopImage_url as image_url, 
                    LS.ShopPhone as contact, LS.ShopOpeningHours as hours, 
                    LS.ShopStatus as availability,
                    COALESCE(SR.ShopRating, 0.0) AS rating 
                FROM Laundry_Shops AS LS
                LEFT JOIN Shop_Rates AS SR ON LS.ShopID = SR.ShopID
                WHERE LS.ShopID = ?`,
                [shopId]
            ),
            
            // 2. Services (Shop_Services)
            connection.query(
                `SELECT SS.SvcID as id, S.SvcName as name, SS.SvcPrice as price, SS.MinLoad as minLoad, SS.MaxLoad as maxLoad
                  FROM Shop_Services SS JOIN Services S ON SS.SvcID = S.SvcID WHERE SS.ShopID = ?`,
                [shopId]
            ),

            // 3. Add-Ons (Shop_Add_Ons)
            connection.query(
                `SELECT SAO.AddOnID as id, AO.AddOnName as name, SAO.AddOnPrice as price
                  FROM Shop_Add_Ons SAO JOIN Add_Ons AO ON SAO.AddOnID = AO.AddOnID WHERE SAO.ShopID = ?`,
                [shopId]
            ),
            
            // 4. Delivery Options (Shop_Delivery_Options)
            connection.query(
                `SELECT SDO.DlvryID as id, DT.DlvryTypeName as name, SDO.DlvryDescription as description
                  FROM Shop_Delivery_Options SDO JOIN Delivery_Types DT ON SDO.DlvryTypeID = DT.DlvryTypeID WHERE SDO.ShopID = ?`,
                [shopId]
            ),

            // 5. Fabric Types (Shop_Fabrics)
            connection.query(
                `SELECT SF.FabID as id, F.FabName as name
                  FROM Shop_Fabrics SF JOIN Fabrics F ON SF.FabID = F.FabID WHERE SF.ShopID = ?`,
                [shopId]
            ),
        ]);

        if (!shopDetails) {
            return res.status(404).json({ success: false, error: "Shop not found." });
        }

        res.json({
            success: true,
            shop: shopDetails,
            services: services[0],
            addOns: addOns[0],
            deliveryOptions: deliveryOptions[0],
            fabricTypes: fabricTypes[0],
        });

    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch shop details." });
    } finally {
        connection.release();
    }
});


// GET /api/shops/:shopId/full-details-owner (Owner Dashboard)
router.get("/:shopId/full-details-owner", async (req, res) => {
    const { shopId } = req.params;
    const connection = await db.getConnection();

    try {
        const [
            [[shopDetails]],
            allRatings,
            [[shopDistance]] 
        ] = await Promise.all([
            connection.query(
                `SELECT 
                    LS.ShopID, LS.ShopName, LS.ShopDescrp, LS.ShopAddress, 
                    LS.ShopPhone, LS.ShopOpeningHours, LS.ShopStatus,
                    COALESCE(AVG(SR.ShopRating), 0.0) AS averageRating
                FROM Laundry_Shops AS LS
                LEFT JOIN Shop_Rates AS SR ON LS.ShopID = SR.ShopID
                WHERE LS.ShopID = ?
                GROUP BY LS.ShopID`,
                [shopId]
            ),
            
            connection.query(
                `SELECT ShopRating FROM Shop_Rates WHERE ShopID = ?`,
                [shopId]
            ),

            connection.query(
                `SELECT ShopLatitude, ShopLongitude FROM Shop_Distance WHERE ShopID = ?`,
                [shopId]
            )
        ]);
        
        if (!shopDetails) {
            return res.status(404).json({ error: "Shop not found." });
        }
        
        const ratingsArray = allRatings[0].map(r => r.ShopRating);
        const ratingCount = ratingsArray.length;
        const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        
        ratingsArray.forEach(rating => {
            const roundedRating = Math.round(rating);
            if (breakdown[roundedRating] !== undefined) {
                breakdown[roundedRating]++;
            }
        });

        res.json({
            success: true,
            details: {
                ShopName: shopDetails.ShopName,
                ShopDescrp: shopDetails.ShopDescrp,
                ShopAddress: shopDetails.ShopAddress,
                ShopPhone: shopDetails.ShopPhone,
                ShopOpeningHours: shopDetails.ShopOpeningHours,
                ShopStatus: shopDetails.ShopStatus,
                ShopLatitude: shopDistance ? shopDistance.ShopLatitude : null,
                ShopLongitude: shopDistance ? shopDistance.ShopLongitude : null,
            },
            rating: {
                averageRating: shopDetails.averageRating,
                ratingCount: ratingCount,
                breakdown: breakdown 
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch shop details." });
    } finally {
        connection.release();
    }
});


// POST /api/shops/create (Create New Shop)
router.post("/create", async (req, res) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const { 
            OwnerID, ShopName, ShopDescrp, ShopAddress, ShopPhone, 
            ShopOpeningHours, ShopStatus, ShopImage_url, 
            ShopLatitude, ShopLongitude
        } = req.body;

        if (!OwnerID || !ShopName || !ShopAddress || !ShopLatitude || !ShopLongitude) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: "Missing required shop details (OwnerID, Name, Address, Latitude, Longitude)." });
        }

        const newShopID = await generateNewShopID(connection);
        
        const shopInsertQuery = `
            INSERT INTO Laundry_Shops 
            (ShopID, OwnerID, ShopName, ShopDescrp, ShopAddress, ShopPhone, ShopOpeningHours, ShopStatus, ShopImage_url) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(
            shopInsertQuery, 
            [newShopID, OwnerID, ShopName, ShopDescrp, ShopAddress, ShopPhone, ShopOpeningHours, ShopStatus, ShopImage_url || null]
        );
        
        const distanceInsertQuery = `
            INSERT INTO Shop_Distance 
            (ShopID, ShopLatitude, ShopLongitude) 
            VALUES (?, ?, ?)
        `;
        await connection.query(
            distanceInsertQuery, 
            [newShopID, ShopLatitude, ShopLongitude]
        );
        
        await connection.commit();
        
        res.status(201).json({ 
            success: true, 
            message: "Shop created and linked successfully!",
            ShopID: newShopID
        });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, error: "Failed to create and link shop details." });
    } finally {
        connection.release();
    }
});

// PUT /api/shops/:shopId (Update Shop Details and Coordinates)
router.put("/:shopId", async (req, res) => {
    const { shopId } = req.params;
    const { 
        ShopName, ShopDescrp, ShopAddress, ShopPhone, ShopOpeningHours, 
        ShopStatus, ShopLatitude, ShopLongitude
    } = req.body;
    
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const [shopResult] = await connection.query(
            `UPDATE Laundry_Shops SET 
                ShopName = ?, ShopDescrp = ?, ShopAddress = ?, 
                ShopPhone = ?, ShopOpeningHours = ?, ShopStatus = ?
            WHERE ShopID = ?`,
            [ShopName, ShopDescrp, ShopAddress, ShopPhone, ShopOpeningHours, ShopStatus, shopId]
        );
        
        if (ShopLatitude && ShopLongitude) {
            await connection.query(
                `INSERT INTO Shop_Distance (ShopID, ShopLatitude, ShopLongitude) 
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE 
                 ShopLatitude = VALUES(ShopLatitude), 
                 ShopLongitude = VALUES(ShopLongitude)`,
                [shopId, ShopLatitude, ShopLongitude]
            );
        }

        if (shopResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Shop not found or no changes made." });
        }
        
        await connection.commit();
        res.json({ success: true, message: "Shop details updated successfully." });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: "Failed to update shop details." });
    } finally {
        connection.release();
    }
});


// =================================================================
// CONFIGURATION ROUTES
// =================================================================

// --- GLOBAL SERVICES (For Dropdown population on frontend) ---
router.get("/global/services", async (req, res) => {
    const connection = await db.getConnection();
    try {
        const [services] = await connection.query(`SELECT SvcID, SvcName FROM Services`);
        res.json({ success: true, services });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch global services." });
    } finally { connection.release(); }
});

// --- SHOP SERVICES (Shop_Services table) ---

router.get("/:shopId/services", async (req, res) => {
    const { shopId } = req.params;
    const connection = await db.getConnection();
    try {
        const [services] = await connection.query(
            `SELECT SS.SvcID, S.SvcName, SS.SvcPrice, SS.MinLoad, SS.MaxLoad
             FROM Shop_Services SS
             JOIN Services S ON SS.SvcID = S.SvcID
             WHERE SS.ShopID = ?`,
            [shopId]
        );
        res.json({ success: true, services });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch services." });
    } finally { connection.release(); }
});

router.post("/services", async (req, res) => {
    const { ShopID, SvcID, SvcPrice, MinLoad, MaxLoad } = req.body;
    if (!ShopID || !SvcID || SvcPrice === undefined) {
        return res.status(400).json({ success: false, message: "Missing required service details." });
    }
    const connection = await db.getConnection();
    try {
        await connection.query(
            `INSERT INTO Shop_Services (ShopID, SvcID, SvcPrice, MinLoad, MaxLoad) 
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                SvcPrice=VALUES(SvcPrice), 
                MinLoad=VALUES(MinLoad), 
                MaxLoad=VALUES(MaxLoad)`,
            [ShopID, SvcID, SvcPrice, MinLoad || 0, MaxLoad || 0]
        );
        res.status(201).json({ success: true, message: "Shop service saved successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to save shop service." });
    } finally { connection.release(); }
});


// --- GLOBAL FABRICS (For Dropdown population on frontend) ---
router.get("/global/fabrics", async (req, res) => {
    const connection = await db.getConnection();
    try {
        const [fabrics] = await connection.query(`SELECT FabID, FabName FROM Fabrics`);
        res.json({ success: true, fabrics });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch global fabrics." });
    } finally { connection.release(); }
});

// --- SHOP FABRICS (Shop_Fabrics junction table) ---

router.get("/:shopId/fabrics", async (req, res) => {
    const { shopId } = req.params;
    const connection = await db.getConnection();
    try {
        const [fabrics] = await connection.query(
            `SELECT SF.FabID, F.FabName
             FROM Shop_Fabrics SF
             JOIN Fabrics F ON SF.FabID = F.FabID
             WHERE SF.ShopID = ?`,
            [shopId]
        );
        res.json({ success: true, fabrics });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch shop fabrics." });
    } finally { connection.release(); }
});

router.post("/fabrics", async (req, res) => {
    const { ShopID, FabID } = req.body;
    if (!ShopID || !FabID) return res.status(400).json({ success: false, message: "Missing shop ID or fabric ID." });
    const connection = await db.getConnection();
    try {
        await connection.query(
            `INSERT IGNORE INTO Shop_Fabrics (ShopID, FabID) VALUES (?, ?)`,
            [ShopID, FabID]
        );
        res.status(201).json({ success: true, message: "Fabric type added successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to add fabric type." });
    } finally { connection.release(); }
});


// --- GLOBAL ADD-ONS (For Dropdown population on frontend) ---
router.get("/global/addons", async (req, res) => {
    const connection = await db.getConnection();
    try {
        const [addons] = await connection.query(`SELECT AddOnID, AddOnName FROM Add_Ons`);
        res.json({ success: true, addons });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch global add-ons." });
    } finally { connection.release(); }
});

// --- SHOP ADD-ONS (Shop_Add_Ons junction table) ---

router.get("/:shopId/addons", async (req, res) => {
    const { shopId } = req.params;
    const connection = await db.getConnection();
    try {
        const [addons] = await connection.query(
            `SELECT SAO.AddOnID, AO.AddOnName, SAO.AddOnPrice
             FROM Shop_Add_Ons SAO
             JOIN Add_Ons AO ON SAO.AddOnID = AO.AddOnID
             WHERE SAO.ShopID = ?`,
            [shopId]
        );
        res.json({ success: true, addons });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch shop add-ons." });
    } finally { connection.release(); }
});

router.post("/addons", async (req, res) => {
    const { ShopID, AddOnID, AddOnPrice } = req.body;
    if (!ShopID || !AddOnID || AddOnPrice === undefined) return res.status(400).json({ success: false, message: "Missing required add-on details." });
    const connection = await db.getConnection();
    try {
        await connection.query(
            `INSERT INTO Shop_Add_Ons (ShopID, AddOnID, AddOnPrice) 
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE 
             AddOnPrice = VALUES(AddOnPrice)`,
            [ShopID, AddOnID, AddOnPrice]
        );
        res.status(201).json({ success: true, message: "Shop add-on saved successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to save shop add-on." });
    } finally { connection.release(); }
});

// --- GLOBAL DELIVERY TYPES (For Dropdown population on frontend) ---
router.get("/global/delivery-types", async (req, res) => {
    const connection = await db.getConnection();
    try {
        const [deliveryTypes] = await connection.query(`SELECT DlvryTypeID, DlvryTypeName, DlvryDescription FROM Delivery_Types`);
        res.json({ success: true, deliveryTypes });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch global delivery types." });
    } finally { connection.release(); }
});

// --- SHOP DELIVERY OPTIONS (Shop_Delivery_Options table) ---

router.get("/:shopId/delivery", async (req, res) => {
    const { shopId } = req.params;
    const connection = await db.getConnection();
    try {
        const [delivery] = await connection.query(
            `SELECT SDO.DlvryID, DT.DlvryTypeName, SDO.DlvryDescription, SDO.DlvryTypeID
             FROM Shop_Delivery_Options SDO
             JOIN Delivery_Types DT ON SDO.DlvryTypeID = DT.DlvryTypeID
             WHERE SDO.ShopID = ?`,
            [shopId]
        );
        res.json({ success: true, delivery });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch shop delivery options." });
    } finally { connection.release(); }
});

router.post("/delivery", async (req, res) => {
    const { ShopID, DlvryTypeID, DlvryDescription } = req.body;
    if (!ShopID || !DlvryTypeID || !DlvryDescription) return res.status(400).json({ success: false, message: "Missing required delivery option details." });
    
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const [existing] = await connection.query(
            `SELECT DlvryID FROM Shop_Delivery_Options WHERE ShopID = ? AND DlvryTypeID = ?`,
            [ShopID, DlvryTypeID]
        );

        let dlvryIdToUse;
        
        if (existing.length > 0) {
            dlvryIdToUse = existing[0].DlvryID;
            await connection.query(
                `UPDATE Shop_Delivery_Options SET DlvryDescription = ? WHERE DlvryID = ?`,
                [DlvryDescription, dlvryIdToUse]
            );
        } else {
            dlvryIdToUse = await generateNextID(connection, 'Shop_Delivery_Options', 'DV', 'DlvryID');
            await connection.query(
                `INSERT INTO Shop_Delivery_Options (DlvryID, ShopID, DlvryTypeID, DlvryDescription) VALUES (?, ?, ?, ?)`,
                [dlvryIdToUse, ShopID, DlvryTypeID, DlvryDescription]
            );
        }
        
        await connection.commit();
        res.status(201).json({ success: true, message: "Shop delivery option saved successfully.", DlvryID: dlvryIdToUse });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: "Failed to save shop delivery option." });
    } finally { connection.release(); }
});


export default router;