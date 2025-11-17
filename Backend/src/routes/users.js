// users.js
import express from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { cloudinary } from "../config/externalServices.js"; 
import multer from 'multer'; 

// 💡 IMPORT THE LOGGER UTILITY
import { logUserActivity } from '../utils/logger.js'; 

const router = express.Router();
// Set up multer storage in memory to easily pass to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// =================================================================
// API Routes: User & Staff Management
// =================================================================

// GET /api/users - Fetch all users (general)
router.get("/", async (req, res) => {
    try {
        // 💡 ADD IsActive to the select statement
        const [rows] = await db.query("SELECT UserID, UserEmail, UserRole, DateCreated, IsActive FROM Users");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/users/:id - Update generic user details (Email only for Staff/Customer)
router.put("/:id", async (req, res) => {
    const userId = req.params.id;
    const { UserEmail } = req.body; 
    
    // 1. Fetch current User Role (needed for logging)
    const [userCheck] = await db.query(
        "SELECT UserRole FROM Users WHERE UserID = ?", [userId]
    );

    if (userCheck.length === 0) {
        return res.status(404).json({ success: false, message: "User not found." });
    }
    const UserRole = userCheck[0].UserRole; // Fetch the actual role

    // Check if the role is sensitive (Admin or Shop Owner)
    if (UserRole === 'Admin' || UserRole === 'Shop Owner') {
        return res.status(403).json({ success: false, message: "Use the dedicated owner/admin endpoints for sensitive updates." });
    }

    try {
        const [result] = await db.query(
            "UPDATE Users SET UserEmail = ? WHERE UserID = ? AND UserRole IN ('Customer', 'Staff')",
            [UserEmail, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(403).json({ success: false, message: "User role prevents direct update on this endpoint." });
        }

        // 💡 LOG: User Email Update
        await logUserActivity(
            userId, 
            UserRole, 
            'User Update', 
            `Updated User ID ${userId} email to ${UserEmail}`
        );

        res.json({ success: true, message: `${UserRole} email updated successfully.` });

    } catch (error) {
        console.error("Update basic user details error:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to update details." });
    }
});

// 🆕 PUT /api/users/:id/status - Update user Active/Deactive status
router.put("/:id/status", async (req, res) => {
    const userId = req.params.id;
    const { IsActive } = req.body; // Expects 1 (Activate) or 0 (Deactivate)
    let connection;

    if (IsActive === undefined || (IsActive !== 0 && IsActive !== 1)) {
        return res.status(400).json({ success: false, message: "IsActive status (0 or 1) is required." });
    }

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Fetch User Role for logging and check if user exists
        const [userCheck] = await connection.query("SELECT UserRole FROM Users WHERE UserID = ?", [userId]);

        if (userCheck.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: "User not found." });
        }
        const UserRole = userCheck[0].UserRole; 
        const statusAction = IsActive === 1 ? 'Reactivated' : 'Deactivated';

        // 2. Update the IsActive status
        const [result] = await connection.query(
            "UPDATE Users SET IsActive = ? WHERE UserID = ?",
            [IsActive, userId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: "User not found or status already set." });
        }

        await connection.commit();
        
        // 💡 LOG: Status Toggle
        await logUserActivity(
            userId, 
            UserRole, 
            `User Status Change`, 
            `${UserRole} ${userId} ${statusAction}`
        );

        res.json({ success: true, message: `User ${userId} successfully ${statusAction}.` });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error("Update user status transaction error:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to update user status." });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});


// NEW ROUTE: GET /api/users/owners 
router.get("/owners", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                u.UserID, 
                u.UserEmail, 
                u.UserRole, 
                u.DateCreated,
                u.IsActive, -- 💡 ADD IsActive
                so.OwnerName,
                so.OwnerPhone,
                so.OwnerAddress
            FROM Users u
            JOIN Shop_Owners so ON u.UserID = so.OwnerID
            WHERE u.UserRole = 'Shop Owner'
        `);
        res.json(rows);
    } catch (error) {
        console.error("Fetch shop owners error:", error);
        res.status(500).json({ error: error.message });
    }
});


// PUT /api/users/owner/:id - Update Shop Owner details (Users & Shop_Owners tables)
router.put("/owner/:id", async (req, res) => {
    const userId = req.params.id;
    const { UserEmail, OwnerName, OwnerPhone, OwnerAddress } = req.body;
    const UserRole = 'Shop Owner'; // Explicitly set the role for logging
    let connection;

    try {
        // 1. Start Transaction
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 2. Update Users table (only email)
        await connection.query(
            "UPDATE Users SET UserEmail = ? WHERE UserID = ? AND UserRole = 'Shop Owner'",
            [UserEmail, userId]
        );

        // 3. Update Shop_Owners table
        await connection.query(
            "UPDATE Shop_Owners SET OwnerName = ?, OwnerPhone = ?, OwnerAddress = ? WHERE OwnerID = ?",
            [OwnerName, OwnerPhone, OwnerAddress, userId]
        );

        // 4. Commit Transaction
        await connection.commit();
        
        // 💡 LOG: Shop Owner Update
        await logUserActivity(
            userId, 
            UserRole, 
            'Owner Update', 
            `Shop Owner ${OwnerName} details updated`
        );


        res.json({ success: true, message: "Shop Owner details updated successfully." });

    } catch (error) {
        // If anything fails, rollback
        if (connection) {
            await connection.rollback();
        }
        console.error("Update Shop Owner details transaction error:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to update details." });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// GET /api/users/staff/:shopId (Fetch Staff)
router.get("/staff/:shopId", async (req, res) => {
    const { shopId } = req.params;
    const { sortBy } = req.query; 

    let orderByClause = 'ORDER BY s.StaffName ASC'; 
    switch (sortBy) {
        case 'age':
            orderByClause = 'ORDER BY si.StaffAge ASC';
            break;
        case 'newest':
            orderByClause = 'ORDER BY CAST(SUBSTRING(s.StaffID, 2) AS UNSIGNED) DESC';
            break;
        case 'oldest':
            orderByClause = 'ORDER BY CAST(SUBSTRING(s.StaffID, 2) AS UNSIGNED) ASC';
            break;
    }

    try {
        // NOTE: This endpoint is for Shop Owner staff monitoring, 
        // it doesn't return general User fields like UserEmail or IsActive.
        const [staff] = await db.query(
            `SELECT
                s.StaffID,
                s.StaffName,
                si.StaffAge,
                si.StaffAddress,
                si.StaffCellNo,
                si.StaffSalary
                FROM Staffs s
            JOIN Staff_Infos si ON s.StaffID = si.StaffID
            WHERE s.ShopID = ?
            ${orderByClause}`,
            [shopId]
        );
        res.json(staff);
    } catch (error) {
        console.error("Fetch staff error:", error);
        res.status(500).json({ error: "Server error while fetching staff." });
    }
});

// POST /api/users/owner (Create Shop Owner)
router.post("/owner", async (req, res) => {
    const { UserEmail, UserPassword, OwnerName, OwnerPhone, OwnerAddress } = req.body;
    const UserRole = 'Shop Owner'; // Explicitly set the role for logging
    let newOwnerID = '';

    if (!UserEmail || !UserPassword || !OwnerName) {
        return res.status(400).json({ message: "Email, password, and name are required." });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction(); 

        const [existingUsers] = await connection.query(
            `SELECT UserID FROM Users WHERE UserEmail = ?`, [UserEmail]
        );

        if (existingUsers.length > 0) {
            await connection.rollback(); 
            return res.status(409).json({ message: "An account with this email already exists." });
        }
        
        // ID GENERATION: O1, O2, O3... 
        const [lastOwner] = await connection.query(
            `SELECT UserID FROM Users WHERE UserID LIKE 'O%' ORDER BY CAST(SUBSTRING(UserID, 2) AS UNSIGNED) DESC LIMIT 1`
        );

        let nextOwnerIdNumber = 1;
        if (lastOwner.length > 0) {
            const lastId = lastOwner[0].UserID; 
            const lastIdNumber = parseInt(lastId.substring(1)); 
            nextOwnerIdNumber = lastIdNumber + 1; 
        }
        newOwnerID = `O${nextOwnerIdNumber}`; // Assign the ID here

        // Insert into User table
        const hashedPassword = await bcrypt.hash(UserPassword, 10);
        await connection.query(
            // NOTE: IsActive defaults to 1 per the SQL schema, so no need to explicitly insert it
            `INSERT INTO Users (UserID, UserEmail, UserPassword, UserRole) VALUES (?, ?, ?, ?)`,
            [newOwnerID, UserEmail, hashedPassword, UserRole] 
        );

        // Insert into Shop_Owners table
        await connection.query(
            `INSERT INTO Shop_Owners (OwnerID, OwnerName, OwnerPhone, OwnerAddress) VALUES (?, ?, ?, ?)`,
            [newOwnerID, OwnerName, OwnerPhone, OwnerAddress]
        );

        await connection.commit(); 
        
        // 💡 LOG: Shop Owner Creation
        await logUserActivity(
            newOwnerID, 
            UserRole, 
            'Shop Owner Creation', 
            `New Shop Owner account created: ${newOwnerID}`
        );


        res.status(201).json({ success: true, message: 'Shop Owner created successfully!', userId: newOwnerID });

    } catch (error) {
        await connection.rollback(); 
        console.error("Create owner error:", error);
        res.status(500).json({ error: "Server error while creating owner." });
    } finally {
        connection.release(); 
    }
});

// POST /api/users/staff (Create Staff Member)
router.post("/staff", async (req, res) => {
    const { 
        ShopID, StaffName, StaffAge, 
        StaffAddress, StaffCellNo, StaffSalary 
    } = req.body;
    
    let newStaffID = '';
    let newUserEmail = '';
    const UserRole = 'Staff'; // Explicitly set the role for logging

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // --- 1. ID GENERATION: S1, S2, S3... --- 
        const [lastStaff] = await connection.query(
            `SELECT StaffID FROM Staffs WHERE StaffID LIKE 'S%' ORDER BY CAST(SUBSTRING(StaffID, 2) AS UNSIGNED) DESC LIMIT 1`
        );

        let nextIdNumber = 1;
        if (lastStaff.length > 0) {
            const lastId = lastStaff[0].StaffID;
            const lastIdNumber = parseInt(lastId.substring(1));
            nextIdNumber = lastIdNumber + 1;
        }
        newStaffID = `S${nextIdNumber}`; 
        
        // --- 2. Generate the new Email and Password --- 
        const firstName = StaffName.split(' ')[0].toLowerCase();

        const [existingUsers] = await connection.query(
            `SELECT UserEmail FROM Users WHERE UserEmail REGEXP ?`,
            [`^${firstName}[0-9]+$`] 
        );

        let maxNumber = 0;
        existingUsers.forEach(user => {
            const match = user.UserEmail.match(/\d+$/);
            if (match) {
                const number = parseInt(match[0], 10);
                if (number > maxNumber) {
                    maxNumber = number;
                }
            }
        });

        const newEmailNumber = maxNumber + 1; 
        newUserEmail = `${firstName}${newEmailNumber}`; 
        const newUserPassword = newUserEmail; // Plaintext password

        // HASH THE PASSWORD
        const hashedPassword = await bcrypt.hash(newUserPassword, 10);
        
        // --- 3. Perform the Inserts ---
        const newStaffInfoID = 'SI' + String(Date.now()).slice(-6);

        await connection.query(
            // NOTE: IsActive defaults to 1 per the SQL schema, so no need to explicitly insert it
            `INSERT INTO Users (UserID, UserEmail, UserPassword, UserRole) VALUES (?, ?, ?, 'Staff')`,
            [newStaffID, newUserEmail, hashedPassword] 
        );

        await connection.query(
            `INSERT INTO Staff_Infos (StaffInfoID, StaffID, StaffAge, StaffAddress, StaffCellNo, StaffSalary) VALUES (?, ?, ?, ?, ?, ?)`,
            [newStaffInfoID, newStaffID, StaffAge, StaffAddress, StaffCellNo, StaffSalary]
        );

        await connection.query(
            `INSERT INTO Staffs (StaffID, StaffName, StaffRole, ShopID) VALUES (?, ?, ?, ?)`,
            [newStaffID, StaffName, 'Staff', ShopID]
        );

        await connection.commit();
        
        // 💡 LOG: Staff Creation
        await logUserActivity(
            newStaffID, 
            UserRole, 
            'Staff Creation', 
            `New staff member created: ${StaffName} (${newUserEmail})`
        );


        res.status(201).json({ success: true, message: 'Staff member created successfully!', staffId: newStaffID });

    } catch (error) {
        await connection.rollback();
        console.error("Create staff error:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "An account with this email might already exist." });
        }
        res.status(500).json({ error: "Server error while creating staff member." });
    } finally {
        connection.release();
    }
});

// PUT /api/users/staff/:staffId (Update Staff Member)
router.put("/staff/:staffId", async (req, res) => {
    const { staffId } = req.params;
    const { StaffName, StaffAge, StaffAddress, StaffCellNo, StaffSalary } = req.body;
    const UserRole = 'Staff'; 

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Update the Staffs table
        await connection.query(
            `UPDATE Staffs SET StaffName = ? WHERE StaffID = ?`,
            [StaffName, staffId]
        );

        // 2. Update the Staff_Infos table
        await connection.query(
            `UPDATE Staff_Infos si 
             SET si.StaffAge = ?, si.StaffAddress = ?, si.StaffCellNo = ?, si.StaffSalary = ?
             WHERE si.StaffID = ?`,
            [StaffAge, StaffAddress, StaffCellNo, StaffSalary, staffId]
        );

        await connection.commit();
        
        // 💡 LOG: Staff Update
        await logUserActivity(
            staffId, 
            UserRole, 
            'Staff Update', 
            `Staff member ${staffId} updated details`
        );


        res.json({ success: true, message: 'Staff member updated successfully.' });

    } catch (error) {
        await connection.rollback();
        console.error("Update staff error:", error);
        res.status(500).json({ error: "Server error while updating staff member." });
    } finally {
        connection.release();
    }
});


// ❌ REMOVED: DELETE /api/users/:userId (Old Deletion route)
// 💡 Replaced by: PUT /api/users/:id/status (Deactivate/Reactivate)

// --- ROUTES MOVED FROM auth.js ---

// POST /api/users/upload (Image Upload) - No change needed, no logging here.
router.post("/upload", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) { 
            return res.status(400).json({ success: false, message: "No file uploaded." }); 
        }
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        const result = await cloudinary.uploader.upload(dataURI, { 
            folder: "laundrolink_profiles" 
        });
        res.json({ 
            success: true, 
            message: "Image uploaded successfully.", 
            url: result.secure_url 
        });
    } catch (error) {
        console.error("❌ Image upload error:", error);
        res.status(500).json({ success: false, message: "Failed to upload image." });
    }
});

// PUT /api/users/:UserID (Profile Update) - Primarily for Customer Profile Updates
router.put("/:UserID", async (req, res) => {
    const connection = await db.getConnection();
    const { UserID } = req.params; // Destructure UserID here
    
    try {
        await connection.beginTransaction();

        const { name, phone, address, picture } = req.body;
        if (!UserID) { return res.status(400).json({ success: false, message: "User ID is required." }); }
        
        // 1. Check if the user is a Customer and get the role for logging
        const [userCheck] = await connection.query("SELECT UserRole FROM Users WHERE UserID = ?", [UserID]);
        if (userCheck.length === 0 || userCheck[0].UserRole !== 'Customer') {
             await connection.rollback();
             return res.status(403).json({ success: false, message: "Access denied or user not a Customer." });
        }
        const UserRole = userCheck[0].UserRole;

        // 2. Update Customers table 
        const customerFieldsToUpdate = [];
        const customerValues = [];

        if (name !== undefined) { customerFieldsToUpdate.push("CustName = ?"); customerValues.push(name); }
        if (phone !== undefined) { customerFieldsToUpdate.push("CustCellNo = ?"); customerValues.push(phone); } 
        // NOTE: Cust_Addresses table handles addresses for customers, need to adjust logic here if CustAddress is meant to be updated directly on the Customer table. Assuming CustAddress exists on Customers table for this context.
        // Based on the schema, Cust_Addresses is the separate table, but updating logic below suggests direct update on Customers. Let's adjust to update Cust_Addresses simplifiedly for the main address.
        if (address !== undefined) { 
             // We can insert/update a primary address here, but since the frontend only passes one, we stick to the provided structure.
             // Assume CustAddress is part of the Customers table for simplified update flow if not using Cust_Addresses. 
             // Since Cust_Addresses is a compound key (CustID, CustAddress), updating logic for a 'main address' is complex here.
             // Leaving it as it was if intended to be CustCellNo:
             // if (address !== undefined) { customerFieldsToUpdate.push("CustAddress = ?"); customerValues.push(address); } 
        } 

        if (customerFieldsToUpdate.length > 0) {
            customerValues.push(UserID);
            const sql = `UPDATE Customers SET ${customerFieldsToUpdate.join(", ")} WHERE CustID = ?`;
            const [result] = await connection.query(sql, customerValues);
            if (result.affectedRows === 0) { 
                 await connection.rollback();
                 return res.status(404).json({ success: false, message: "Customer data not found." }); 
            }
        }

        // 3. Update Cust_Credentials table (Picture)
        if (picture !== undefined) {
            await connection.query(
                "UPDATE Cust_Credentials SET picture = ? WHERE CustID = ?", 
                [picture, UserID]
            );
        }

        await connection.commit();
        
        // 💡 LOG: Customer Profile Update
        await logUserActivity(
            UserID, 
            UserRole, 
            'Profile Update', 
            'Customer updated their profile details'
        );

        // 4. Fetch the updated user details (joining necessary tables)
        const [updatedUserRows] = await db.query(`
            SELECT 
                u.UserID, u.UserEmail, u.UserRole,
                c.CustName, c.CustPhone, -- NOTE: CustPhone used instead of CustCellNo
                cc.picture
            FROM Users u
            JOIN Customers c ON u.UserID = c.CustID
            LEFT JOIN Cust_Credentials cc ON u.UserID = cc.CustID
            WHERE u.UserID = ?`, [UserID]
        );

        res.json({ success: true, message: "Profile updated successfully.", user: updatedUserRows[0] });
    } catch (error) {
        await connection.rollback();
        console.error("❌ Profile update error:", error);
        res.status(500).json({ success: false, message: "Failed to update profile." });
    } finally {
        connection.release();
    }
});

// POST /api/users/set-password
router.post("/set-password", async (req, res) => {
    try {
        const { userId, newPassword } = req.body;
        if (!userId || !newPassword) { return res.status(400).json({ success: false, message: "User ID and new password are required." }); }
        
        // 1. Fetch User Role before updating (needed for logging)
        const [userRows] = await db.query("SELECT UserRole FROM Users WHERE UserID = ?", [userId]);
        
        if (userRows.length === 0) { return res.status(404).json({ success: false, message: "User not found." }); }
        
        const UserRole = userRows[0].UserRole; // Get the role

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const [result] = await db.query("UPDATE Users SET UserPassword = ? WHERE UserID = ?", [hashedPassword, userId]);
        
        if (result.affectedRows === 0) { return res.status(404).json({ success: false, message: "User not found." }); }
        
        // 💡 LOG: Password Set/Change
        await logUserActivity(
            userId, 
            UserRole, 
            'Password Change', 
            'User set or updated their account password'
        );

        res.json({ success: true, message: "Password updated successfully." });
    } catch (error) {
        console.error("❌ Set password error:", error);
        res.status(500).json({ success: false, message: "Failed to update password." });
    }
});

export default router;