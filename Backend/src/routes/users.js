import express from "express";
import db from "../db.js";

const router = express.Router();

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        const [users] = await db.query(
            `SELECT UserID, UserEmail, UserRole FROM Users WHERE UserEmail = ? AND UserPassword = ?`,
            [email, password]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = users[0];
        let userDetails = { ...user };

        // --- 1. Fetch details based on UserRole ---

        if (user.UserRole === 'Shop Owner') { 
            const [ownerDetails] = await db.query(
                // Using corrected plural table names: Shop_Owners and Laundry_Shops
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
                // Using corrected plural table names: Staffs and Laundry_Shops
                `SELECT sh.ShopID, sh.ShopName 
                 FROM Staffs s 
                 JOIN Laundry_Shops sh ON s.ShopID = sh.ShopID 
                 WHERE s.StaffID = ?`,
                [user.UserID]
            );
            if (staffDetails.length > 0) {
                userDetails = { ...userDetails, ...staffDetails[0] };
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

router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT UserID, UserEmail, UserRole FROM Users");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/users/owner
// Creates a new Shop Owner with sequential O1, O2, etc., UserID
router.post("/owner", async (req, res) => {
    const { UserEmail, UserPassword, OwnerName, OwnerPhone, OwnerAddress } = req.body;

    // Basic validation
    if (!UserEmail || !UserPassword || !OwnerName) {
        return res.status(400).json({ message: "Email, password, and name are required." });
    }

    const connection = await db.getConnection(); 

    try {
        await connection.beginTransaction(); 

        // Check if the email already exists
        const [existingUsers] = await connection.query(
            `SELECT UserID FROM Users WHERE UserEmail = ?`, [UserEmail]
        );

        if (existingUsers.length > 0) {
            await connection.rollback(); 
            return res.status(409).json({ message: "An account with this email already exists." });
        }
        
        // --- ✅ NEW ID GENERATION: O1, O2, O3... ---
        // Find the highest existing Owner ID number
        const [lastOwner] = await connection.query(
            // Searches for UserIDs starting with 'O' and sorts them numerically by the number part
            `SELECT UserID FROM Users WHERE UserID LIKE 'O%' ORDER BY CAST(SUBSTRING(UserID, 2) AS UNSIGNED) DESC LIMIT 1`
        );

        let nextOwnerIdNumber = 1;
        if (lastOwner.length > 0) {
            const lastId = lastOwner[0].UserID; 
            // Parse the number part (e.g., extracts 10 from "O10")
            const lastIdNumber = parseInt(lastId.substring(1)); 
            nextOwnerIdNumber = lastIdNumber + 1; 
        }
        const newOwnerID = `O${nextOwnerIdNumber}`; // e.g., "O1", "O2", etc.
        // ---------------------------------------------


        // Insert into User table
        await connection.query(
            `INSERT INTO Users (UserID, UserEmail, UserPassword, UserRole) VALUES (?, ?, ?, ?)`,
            [newOwnerID, UserEmail, UserPassword, 'Shop Owner']
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

// PUT /api/users/:userId/role
// Updates a user's role
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

// DELETE /api/users/:userId
// Deletes a user
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


// GET /api/users/staff/:shopId
// Fetches all staff members for a specific shop with sorting
router.get("/staff/:shopId", async (req, res) => {
    const { shopId } = req.params;
    const { sortBy } = req.query; // Get the sortBy parameter from the URL query

    // Determine the SQL ORDER BY clause based on the sortBy parameter
    let orderByClause = 'ORDER BY s.StaffName ASC'; // Default sort by name
    switch (sortBy) {
        case 'age':
            orderByClause = 'ORDER BY si.StaffAge ASC';
            break;
        case 'newest':
            // Sort by the numeric part of the StaffID in descending order (assuming S1, S2, S3...)
            orderByClause = 'ORDER BY CAST(SUBSTRING(s.StaffID, 2) AS UNSIGNED) DESC';
            break;
        case 'oldest':
             // Sort by the numeric part of the StaffID in ascending order
            orderByClause = 'ORDER BY CAST(SUBSTRING(s.StaffID, 2) AS UNSIGNED) ASC';
            break;
    }

    try {
        // Using corrected plural table names: Staffs and Staff_Infos
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

// POST /api/users/staff
// Creates a new staff member with sequential S1, S2, etc., StaffID
router.post("/staff", async (req, res) => {
    const { 
        ShopID, StaffName, StaffAge, 
        StaffAddress, StaffCellNo, StaffSalary 
    } = req.body;

    if (!ShopID || !StaffName) {
        return res.status(400).json({ message: "ShopID and name are required." });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // --- 1. ✅ NEW ID GENERATION: S1, S2, S3... ---
        // Find the highest existing Staff ID number
        const [lastStaff] = await connection.query(
            // Searches for StaffIDs starting with 'S' and sorts them numerically by the number part
            `SELECT StaffID FROM Staffs WHERE StaffID LIKE 'S%' ORDER BY CAST(SUBSTRING(StaffID, 2) AS UNSIGNED) DESC LIMIT 1`
        );

        let nextIdNumber = 1;
        if (lastStaff.length > 0) {
            const lastId = lastStaff[0].StaffID;
            // Parse the number part (e.g., extracts 15 from "S15")
            const lastIdNumber = parseInt(lastId.substring(1));
            nextIdNumber = lastIdNumber + 1;
        }
        const newStaffID = `S${nextIdNumber}`; // e.g., "S1", "S2", etc.
        // ---------------------------------------------
        
        // --- 2. Generate the new Email and Password ---
        const firstName = StaffName.split(' ')[0].toLowerCase();

        // Find the highest number used for this specific first name
        // The original logic here seems complex for a simple auto-generated username, 
        // but I'm keeping it for now to avoid breaking existing naming conventions.
        const [existingUsers] = await connection.query(
            `SELECT UserEmail FROM Users WHERE UserEmail REGEXP ?`,
            [`^${firstName}[0-9]+$`] // Matches emails like 'john1', 'john2', etc.
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
        const newUserPassword = newUserEmail; 

        // --- 3. Perform the Inserts ---
        // StaffInfoID retains its timestamp-based uniqueness
        const newStaffInfoID = 'SI' + String(Date.now()).slice(-6);

        await connection.query(
            `INSERT INTO Users (UserID, UserEmail, UserPassword, UserRole) VALUES (?, ?, ?, 'Staff')`,
            [newStaffID, newUserEmail, newUserPassword]
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

// PUT /api/users/staff/:staffId
// Updates a staff member's information
router.put("/staff/:staffId", async (req, res) => {
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


export default router;