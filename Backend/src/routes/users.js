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
      `SELECT UserID, UserEmail, UserRole FROM User WHERE UserEmail = ? AND UserPassword = ?`,
      [email, password]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = users[0];
    let userDetails = { ...user };

    // *** THIS IS THE CORRECTED LINE ***
    // It now checks for "Shop Owner" to match your database data
    if (user.UserRole === 'Shop Owner') { 
      const [ownerDetails] = await db.query(
        `SELECT s.ShopID, s.ShopName 
         FROM Shop_Owner o 
         JOIN Laundry_Shop s ON o.OwnerID = s.OwnerID 
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
         FROM Staff s 
         JOIN Laundry_Shop sh ON s.ShopID = sh.ShopID 
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
    const [rows] = await db.query("SELECT UserID, UserEmail, UserRole FROM User");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add this new route to your users.js file

// POST /api/users/owner
// Creates a new Shop Owner
router.post("/owner", async (req, res) => {
    const { UserEmail, UserPassword, OwnerName, OwnerPhone, OwnerAddress } = req.body;

    // Basic validation
    if (!UserEmail || !UserPassword || !OwnerName) {
        return res.status(400).json({ message: "Email, password, and name are required." });
    }

    const connection = await db.getConnection(); // Get a connection from the pool

    try {
        await connection.beginTransaction(); // Start a transaction

        // Check if the email already exists
        const [existingUsers] = await connection.query(
            `SELECT UserID FROM User WHERE UserEmail = ?`, [UserEmail]
        );

        if (existingUsers.length > 0) {
            await connection.rollback(); // Rollback transaction
            return res.status(409).json({ message: "An account with this email already exists." });
        }
        
        // Generate a new UserID for the owner
        // This is a simple example; you might want a more robust ID generation system
        const newOwnerID = 'O25-' + String(Date.now()).slice(-5);

        // Insert into User table
        await connection.query(
            `INSERT INTO User (UserID, UserEmail, UserPassword, UserRole) VALUES (?, ?, ?, ?)`,
            [newOwnerID, UserEmail, UserPassword, 'Shop Owner']
        );

        // Insert into Shop_Owner table
        await connection.query(
            `INSERT INTO Shop_Owner (OwnerID, OwnerName, OwnerPhone, OwnerAddress) VALUES (?, ?, ?, ?)`,
            [newOwnerID, OwnerName, OwnerPhone, OwnerAddress]
        );

        await connection.commit(); // Commit the transaction if both inserts succeed

        res.status(201).json({ success: true, message: 'Shop Owner created successfully!', userId: newOwnerID });

    } catch (error) {
        await connection.rollback(); // Rollback the transaction on any error
        console.error("Create owner error:", error);
        res.status(500).json({ error: "Server error while creating owner." });
    } finally {
        connection.release(); // ALWAYS release the connection back to the pool
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
            `UPDATE User SET UserRole = ? WHERE UserID = ?`,
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
            `DELETE FROM User WHERE UserID = ?`,
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

    // ✅ NEW: Determine the SQL ORDER BY clause based on the sortBy parameter
    let orderByClause = 'ORDER BY s.StaffName ASC'; // Default sort by name
    switch (sortBy) {
        case 'age':
            orderByClause = 'ORDER BY si.StaffAge ASC';
            break;
        case 'newest':
            // Sort by the numeric part of the StaffID in descending order
            orderByClause = 'ORDER BY CAST(SUBSTRING_INDEX(s.StaffID, "-", -1) AS UNSIGNED) DESC';
            break;
        case 'oldest':
             // Sort by the numeric part of the StaffID in ascending order
            orderByClause = 'ORDER BY CAST(SUBSTRING_INDEX(s.StaffID, "-", -1) AS UNSIGNED) ASC';
            break;
    }

    try {
        // ✅ UPDATED: The orderByClause is now dynamically added to the query
        const [staff] = await db.query(
            `SELECT 
                s.StaffID, 
                s.StaffName, 
                si.StaffAge, 
                si.StaffAddress, 
                si.StaffCellNo, 
                si.StaffSalary
            FROM Staff s
            JOIN Staff_Info si ON s.StaffInfoID = si.StaffInfoID
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

// In Backend/src/routes/users.js

// POST /api/users/staff
// Creates a new staff member with auto-generated ID and credentials
router.post("/staff", async (req, res) => {
    // Email and Password are no longer sent from the client
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

        // --- 1. Generate the new StaffID ---
        const currentYear = new Date().getFullYear().toString().slice(-2); // e.g., "25" for 2025
        const idPrefix = `S${currentYear}-`;

        // Find the highest existing StaffID for the current year
        const [lastStaff] = await connection.query(
            // Use CAST to ensure correct numeric sorting of the ID's number part
            `SELECT StaffID FROM Staff WHERE StaffID LIKE ? ORDER BY CAST(SUBSTRING_INDEX(StaffID, '-', -1) AS UNSIGNED) DESC LIMIT 1`,
            [`${idPrefix}%`]
        );

        let nextIdNumber = 1;
        if (lastStaff.length > 0) {
            const lastId = lastStaff[0].StaffID;
            const lastIdNumber = parseInt(lastId.split('-')[1]);
            nextIdNumber = lastIdNumber + 1;
        }
        const newStaffID = `${idPrefix}${nextIdNumber}`;
        
        // --- ✅ 2. Generate the new Email and Password (CORRECTED LOGIC) ---
        const firstName = StaffName.split(' ')[0].toLowerCase();

        // Find the highest number used for this specific first name
        const [existingUsers] = await connection.query(
            `SELECT UserEmail FROM User WHERE UserEmail REGEXP ?`,
            [`^${firstName}[0-9]+$`] // Matches emails like 'john1', 'john2', etc.
        );

        let maxNumber = 0;
        existingUsers.forEach(user => {
            // Extracts the number from the end of the email string
            const match = user.UserEmail.match(/\d+$/);
            if (match) {
                const number = parseInt(match[0], 10);
                if (number > maxNumber) {
                    maxNumber = number;
                }
            }
        });

        const newEmailNumber = maxNumber + 1; // Increment the highest number found
        const newUserEmail = `${firstName}${newEmailNumber}`; // e.g., marimar5
        const newUserPassword = newUserEmail; // Password is the same as the email

        // --- 3. Perform the Inserts ---
        const newStaffInfoID = 'SI' + String(Date.now()).slice(-6);

        await connection.query(
            `INSERT INTO User (UserID, UserEmail, UserPassword, UserRole) VALUES (?, ?, ?, 'Staff')`,
            [newStaffID, newUserEmail, newUserPassword]
        );

        await connection.query(
            `INSERT INTO Staff_Info (StaffInfoID, StaffAge, StaffAddress, StaffCellNo, StaffSalary) VALUES (?, ?, ?, ?, ?)`,
            [newStaffInfoID, StaffAge, StaffAddress, StaffCellNo, StaffSalary]
        );

        await connection.query(
            `INSERT INTO Staff (StaffID, StaffName, StaffRole, ShopID, StaffInfoID) VALUES (?, ?, ?, ?, ?)`,
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

        // 1. Update the Staff table
        await connection.query(
            `UPDATE Staff SET StaffName = ? WHERE StaffID = ?`,
            [StaffName, staffId]
        );

        // 2. Update the Staff_Info table
        await connection.query(
            `UPDATE Staff_Info si 
             JOIN Staff s ON si.StaffInfoID = s.StaffInfoID
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