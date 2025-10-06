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

export default router;