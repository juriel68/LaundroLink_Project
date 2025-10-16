import express from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { cloudinary } from "../config/services.js"; // Import cloudinary
import multer from 'multer'; // Import multer for file handling

const router = express.Router();
// Set up multer storage in memory to easily pass to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// =================================================================
// API Routes: User & Staff Management
// =================================================================

// GET /api/users
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT UserID, UserEmail, UserRole FROM Users");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/users/staff/:shopId
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
        const [staff] = await db.query(
            `SELECT
                s.StaffID,
                s.StaffName,
                si.StaffAge,
                si.StaffAddress,
                si.StaffCellNo,
                si.StaffSalary
                FROM Staffs s
            JOIN Staff_Infos si ON s.StaffInfoID = si.StaffInfoID
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
        
        // ID GENERATION: O1, O2, O3... (Your existing logic)
        const [lastOwner] = await connection.query(
            `SELECT UserID FROM Users WHERE UserID LIKE 'O%' ORDER BY CAST(SUBSTRING(UserID, 2) AS UNSIGNED) DESC LIMIT 1`
        );

        let nextOwnerIdNumber = 1;
        if (lastOwner.length > 0) {
            const lastId = lastOwner[0].UserID; 
            const lastIdNumber = parseInt(lastId.substring(1)); 
            nextOwnerIdNumber = lastIdNumber + 1; 
        }
        const newOwnerID = `O${nextOwnerIdNumber}`;

        // Insert into User table
        const hashedPassword = await bcrypt.hash(UserPassword, 10);
        await connection.query(
            `INSERT INTO Users (UserID, UserEmail, UserPassword, UserRole) VALUES (?, ?, ?, ?)`,
            [newOwnerID, UserEmail, hashedPassword, 'Shop Owner'] // FIX: Hashed the password here
        );

        // Insert into Shop_Owners table
        await connection.query(
            `INSERT INTO Shop_Owners (OwnerID, OwnerName, OwnerPhone, OwnerAddress) VALUES (?, ?, ?, ?)`,
            [newOwnerID, OwnerName, OwnerPhone, OwnerAddress]
        );

        await connection.commit(); 

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

    // ... (rest of your /staff route logic for ID generation and insertion remains the same)
    // NOTE: This route should probably use bcrypt.hash for the password for security,
    // but I'm keeping the original logic for now since you didn't ask to fix it.

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // --- 1. ID GENERATION: S1, S2, S3... --- (Your existing logic)
        const [lastStaff] = await connection.query(
            `SELECT StaffID FROM Staffs WHERE StaffID LIKE 'S%' ORDER BY CAST(SUBSTRING(StaffID, 2) AS UNSIGNED) DESC LIMIT 1`
        );

        let nextIdNumber = 1;
        if (lastStaff.length > 0) {
            const lastId = lastStaff[0].StaffID;
            const lastIdNumber = parseInt(lastId.substring(1));
            nextIdNumber = lastIdNumber + 1;
        }
        const newStaffID = `S${nextIdNumber}`; 
        
        // --- 2. Generate the new Email and Password --- (Your existing logic)
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
        const newUserEmail = `${firstName}${newEmailNumber}`; 
        const newUserPassword = newUserEmail; // Plaintext password

        // HASH THE PASSWORD
        const hashedPassword = await bcrypt.hash(newUserPassword, 10);
        
        // --- 3. Perform the Inserts ---
        const newStaffInfoID = 'SI' + String(Date.now()).slice(-6);

        await connection.query(
            `INSERT INTO Users (UserID, UserEmail, UserPassword, UserRole) VALUES (?, ?, ?, 'Staff')`,
            [newStaffID, newUserEmail, hashedPassword] // FIX: Using Hashed Password
        );

        await connection.query(
            `INSERT INTO Staff_Infos (StaffInfoID, StaffAge, StaffAddress, StaffCellNo, StaffSalary) VALUES (?, ?, ?, ?, ?)`,
            [newStaffInfoID, StaffAge, StaffAddress, StaffCellNo, StaffSalary]
        );

        await connection.query(
            `INSERT INTO Staffs (StaffID, StaffName, StaffRole, ShopID, StaffInfoID) VALUES (?, ?, ?, ?, ?)`,
            [newStaffID, StaffName, 'Staff', ShopID, newStaffInfoID]
        );

        await connection.commit();
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
    // ... (Your existing logic remains the same)
    const { staffId } = req.params;
    const { StaffName, StaffAge, StaffAddress, StaffCellNo, StaffSalary } = req.body;

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
             JOIN Staffs s ON si.StaffInfoID = s.StaffInfoID
             SET si.StaffAge = ?, si.StaffAddress = ?, si.StaffCellNo = ?, si.StaffSalary = ?
             WHERE s.StaffID = ?`,
            [StaffAge, StaffAddress, StaffCellNo, StaffSalary, staffId]
        );

        await connection.commit();
        res.json({ success: true, message: 'Staff member updated successfully.' });

    } catch (error) {
        await connection.rollback();
        console.error("Update staff error:", error);
        res.status(500).json({ error: "Server error while updating staff member." });
    } finally {
        connection.release();
    }
});

// PUT /api/users/:userId/role (Update User Role)
router.put("/:userId/role", async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role) {
        return res.status(400).json({ message: "Role is required." });
    }

    try {
        const [result] = await db.query(
            `UPDATE Users SET UserRole = ? WHERE UserID = ?`,
            [role, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        res.json({ success: true, message: "User role updated successfully." });
    } catch (error) {
        console.error("Update role error:", error);
        res.status(500).json({ error: "Server error while updating role." });
    }
});

// DELETE /api/users/:userId (Delete User)
router.delete("/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        const [result] = await db.query(
            `DELETE FROM Users WHERE UserID = ?`,
            [userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        res.json({ success: true, message: "User deleted successfully." });
    } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({ error: "Server error while deleting user." });
    }
});

// --- ROUTES MOVED FROM auth.js ---

// POST /api/users/upload (Image Upload)
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

// PUT /api/users/:UserID (Profile Update)
router.put("/:UserID", async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { UserID } = req.params;
        const { name, phone, address, picture } = req.body;
        if (!UserID) { return res.status(400).json({ success: false, message: "User ID is required." }); }
        
        // 1. Update Customers table (Name, Phone, Address)
        const customerFieldsToUpdate = [];
        const customerValues = [];

        if (name !== undefined) { customerFieldsToUpdate.push("CustName = ?"); customerValues.push(name); }
        if (phone !== undefined) { customerFieldsToUpdate.push("CustCellNo = ?"); customerValues.push(phone); } // FIX: Changed phone to CustCellNo
        if (address !== undefined) { customerFieldsToUpdate.push("CustAddress = ?"); customerValues.push(address); } // FIX: Changed address to CustAddress

        if (customerFieldsToUpdate.length > 0) {
            customerValues.push(UserID);
            const sql = `UPDATE Customers SET ${customerFieldsToUpdate.join(", ")} WHERE CustID = ?`;
            const [result] = await connection.query(sql, customerValues);
            if (result.affectedRows === 0) { 
                await connection.rollback();
                return res.status(404).json({ success: false, message: "Customer not found." }); 
            }
        }

        // 2. Update Cust_Credentials table (Picture)
        if (picture !== undefined) {
            await connection.query(
                "UPDATE Cust_Credentials SET picture = ? WHERE CustID = ?", 
                [picture, UserID]
            );
        }

        await connection.commit();

        // 3. Fetch the updated user details (joining necessary tables)
        const [updatedUserRows] = await db.query(`
            SELECT 
                u.UserID, u.UserEmail, u.UserRole,
                c.CustName, c.CustCellNo, c.CustAddress,
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
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        // FIX: Use UserPassword column for update
        const [result] = await db.query("UPDATE Users SET UserPassword = ? WHERE UserID = ?", [hashedPassword, userId]);
        
        if (result.affectedRows === 0) { return res.status(404).json({ success: false, message: "User not found." }); }
        
        res.json({ success: true, message: "Password updated successfully." });
    } catch (error) {
        console.error("❌ Set password error:", error);
        res.status(500).json({ success: false, message: "Failed to update password." });
    }
});

// POST /api/users/login (This route is redundant/incorrectly placed)
// The primary login logic should be in auth.js. This route has been left
// for your reference but should be removed or renamed if it is only used
// for staff/owner credential checks.
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        // Since this is in users.js, we assume this is only for non-OTP login (e.g., admin/staff)
        const [users] = await db.query(
            `SELECT UserID, UserEmail, UserPassword, UserRole FROM Users WHERE UserEmail = ?`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        
        const user = users[0];
        const match = await bcrypt.compare(password, user.UserPassword);
        
        if (!match) { // FIX: Use bcrypt for password comparison
             return res.status(401).json({ message: "Invalid credentials" });
        }

        let userDetails = { UserID: user.UserID, UserEmail: user.UserEmail, UserRole: user.UserRole };

        // --- 1. Fetch details based on UserRole ---

        if (user.UserRole === 'Shop Owner') { 
            const [ownerDetails] = await db.query(
                `SELECT s.ShopID, s.ShopName
                 FROM Shop_Owners o
                 JOIN Laundry_Shops s ON o.OwnerID = s.OwnerID
                 WHERE o.OwnerID = ?`,
                [user.UserID]
            );
            if (ownerDetails.length > 0) {
                userDetails = { ...userDetails, ...ownerDetails[0] };
            }
        } 
        else if (user.UserRole === 'Staff') {
            const [staffDetails] = await db.query(
                `SELECT sh.ShopID, sh.ShopName
                 FROM Staffs s
                 JOIN Laundry_Shops sh ON s.ShopID = sh.ShopID
                 WHERE s.StaffID = ?`,
                [user.UserID]
            );
            if (staffDetails.length > 0) {
                userDetails = { ...userDetails, ...staffDetails[0] };
            }
        } else if (user.UserRole === 'Customer') { // Fetch customer info
             const [customerDetails] = await db.query(
                `SELECT CustName, CustCellNo, CustAddress FROM Customers WHERE CustID = ?`,
                [user.UserID]
            );
            if (customerDetails.length > 0) {
                userDetails = { ...userDetails, ...customerDetails[0] };
            }
        }

        res.json({
            success: true,
            user: userDetails,
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Server error, please try again later" });
    }
});


export default router;