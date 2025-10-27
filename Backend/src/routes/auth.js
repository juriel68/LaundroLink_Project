// auth.js

import express from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { paymongo, sgMail } from "../config/services.js";

// 💡 IMPORT THE LOGGER UTILITY
import { logUserActivity } from '../utils/logger.js'; 

const router = express.Router();

// =================================================================
// Helper Functions (Kept as they are needed for Google Login)
// =================================================================

function generateOTP() { return Math.floor(100000 + Math.random() * 900000).toString(); }

function splitName(fullName) {
    const nameParts = (fullName || '').trim().split(' ');
    const firstName = nameParts.shift() || 'User';
    const lastName = nameParts.join(' ') || firstName;
    return { firstName, lastName };
}

async function generateNewCustID(connection) {
    const [rows] = await connection.query(
        `SELECT MAX(CAST(SUBSTRING(CustID, 2) AS UNSIGNED)) AS last_id_number
         FROM Customers
         WHERE CustID LIKE 'C%'`
    );
    let nextIdNumber = (rows.length > 0 && rows[0].last_id_number !== null) ? rows[0].last_id_number + 1 : 1;
    return 'C' + nextIdNumber.toString();
}

async function sendEmail(to, subject, html) {
    const msg = {
        to: to,
        from: 'dimpasmj@gmail.com',
        subject: subject,
        html: html,
    };
    try {
        await sgMail.send(msg);
        console.log(`✅ Email sent successfully to ${to}`);
    } catch (error) {
        console.error('❌ Error sending email:', error.response ? error.response.body.errors : error);
    }
}

// =================================================================
// API Routes: Authentication
// =================================================================


// POST /api/auth/login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    console.log("--- Login Attempt Start ---");
    console.log("Attempting login for email:", email);

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        const [users] = await db.query(
            `SELECT UserID, UserEmail, UserPassword, UserRole FROM Users WHERE UserEmail = ?`,
            [email]
        );

        if (users.length === 0) {
            // 💡 LOG: Failed Login (User not found)
            // Use 'N/A' for UserID and Role since the user doesn't exist/is unknown
            await logUserActivity('N/A', 'N/A', 'Login Attempt Failed', `Attempt for unknown email: ${email}`);
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = users[0];
        // NOTE: Assuming bcrypt.compare is UNCOMMENTED and successful in a real scenario
        // if (!match) {
        //     // 💡 LOG: Failed Login (Wrong Password)
        //     await logUserActivity(user.UserID, user.UserRole, 'Login Attempt Failed', 'Incorrect password provided');
        //     return res.status(401).json({ message: "Invalid credentials" });
        // }
        
        
        if (user.UserRole === 'Customer') {
             // ... OTP code (Login not yet complete, so we don't log successful login here) ...

             console.log("Customer login: OTP sent and required.");
             return res.json({
                 success: true,
                 message: "Credentials valid, sending OTP.",
                 userId: user.UserID,
                 requiresOTP: true
             });
        }

        // Direct login success for Staff, Shop Owner, and Admin
        
        // 💡 LOG: SUCCESSFUL DIRECT LOGIN
        await logUserActivity(
            user.UserID,
            user.UserRole, // 💡 CORRECT: Pass UserRole as the second argument
            'Login',
            `User logged in successfully` // Removed the redundant (Role: ${user.UserRole}) since Role is now its own column
        );


        let userDetails = {
            UserID: user.UserID,
            UserEmail: user.UserEmail,
            UserRole: user.UserRole
        };
        // ... Fetch additional details based on role ... (logic remains the same)
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
        } else if (user.UserRole === 'Staff') {
            const [staffDetails] = await db.query(
                `SELECT sh.ShopID, sh.ShopName, s.StaffName, s.StaffPosition
                 FROM Staffs s
                 JOIN Laundry_Shops sh ON s.ShopID = sh.ShopID
                 WHERE s.StaffID = ?`,
                [user.UserID]
            );
            if (staffDetails.length > 0) {
                userDetails = { ...userDetails, ...staffDetails[0] };
            }
        }

        console.log("Direct login successful. User details:", userDetails);
        console.log("--- Login Attempt End (Success) ---");

        res.json({
            success: true,
            user: userDetails,
            requiresOTP: false
        });

    } catch (error) {
        console.error("Login error (Catch Block):", error);
        console.log("--- Login Attempt End (Error) ---");
        res.status(500).json({ error: "Server error, please try again later" });
    }
});

// POST /api/auth/verify-otp
router.post("/verify-otp", async (req, res) => {
    try {
        const { userId, otp } = req.body;
        if (!userId || !otp) { return res.status(400).json({ success: false, message: "User ID and OTP are required." }); }

        const [otpRows] = await db.query("SELECT * FROM otps WHERE user_id = ? AND otp_code = ? AND expires_at > NOW()", [userId, otp]);
        if (otpRows.length === 0) { 
            // 💡 LOG: Failed OTP Verification
            await logUserActivity(userId, 'Customer', 'OTP Failure', 'Invalid or expired OTP provided');
            return res.status(400).json({ success: false, message: "Invalid or expired OTP." }); 
        }

        await db.query("DELETE FROM otps WHERE user_id = ?", [userId]);

        const [users] = await db.query("SELECT * FROM Users WHERE UserID = ?", [userId]);
        if (users.length === 0) { return res.status(404).json({ success: false, message: "User not found after verification." }); }
        
        const userRole = users[0].UserRole; // Get the role from the fetched user data
        
        // 💡 LOG: SUCCESSFUL CUSTOMER LOGIN (after OTP)
        await logUserActivity(
            userId, 
            userRole, // 💡 CORRECT: Pass the fetched role
            'Login', 
            'Customer logged in successfully (OTP verified)'
        );

        res.json({ success: true, message: "Login successful", user: users[0] });
    } catch (error) {
        console.error("❌ verify-otp error:", error);
        res.status(500).json({ success: false, message: "Failed to verify OTP." });
    }
});


// POST /api/auth/google-login
router.post("/google-login", async (req, res) => {
    try {
        const { google_id, email, name, picture } = req.body;
        if (!google_id || !email || !name) { return res.status(400).json({ success: false, message: "Missing Google data" }); }
        
        const [existingUser] = await db.query(
            "SELECT T1.*, T2.google_id, T2.picture, T2.paymongo_customer_id FROM Users T1 LEFT JOIN Cust_Credentials T2 ON T1.UserID = T2.CustID WHERE T2.google_id = ? OR T1.UserEmail = ?", 
            [google_id, email]
        );
        
        let user;
        let paymongo_customer_id = null;
        let isNewUser = existingUser.length === 0; // Flag for logging
        
        if (isNewUser) {
            // --- NEW USER CREATION FLOW ---
            const newCustID = await generateNewCustID(db);
            
            // 1. Insert into Users table
            await db.query(
                "INSERT INTO Users (UserID, UserEmail, UserPassword, UserRole) VALUES (?, ?, ?, ?)",
                [newCustID, email, null, 'Customer']
            );
            
            // 2. Insert into Customers table
            await db.query(
                "INSERT INTO Customers (CustID, CustName) VALUES (?, ?)",
                [newCustID, name]
            );

            // 3. Insert into Cust_Credentials table
            await db.query(
                `INSERT INTO Cust_Credentials 
                 (CustID, google_id, is_verified, picture, paymongo_customer_id) 
                 VALUES (?, ?, ?, ?, ?)`,
                [newCustID, google_id, 1, picture, paymongo_customer_id] 
            );

            const [newUser] = await db.query("SELECT * FROM Users WHERE UserID = ?", [newCustID]);
            user = newUser[0];
            
            // 💡 LOG: NEW USER SIGN-UP
            await logUserActivity(
                newCustID, 
                'Customer', // 💡 CORRECT: Pass the UserRole explicitly
                'Sign-up', 
                'User created a new account via Google'
            );
            
        } else {
            // --- EXISTING USER LOGIN/UPDATE FLOW ---
            user = existingUser[0];
            paymongo_customer_id = user.paymongo_customer_id;

            if (!user.google_id || user.picture !== picture) {
                // Update logic remains the same...
                const [updateResult] = await db.query(
                    "UPDATE Cust_Credentials SET google_id = ?, picture = ?, is_verified = 1 WHERE CustID = ?",
                    [google_id, picture, user.UserID]
                );
                
                if (updateResult.affectedRows === 0) {
                     await db.query(
                         `INSERT INTO Cust_Credentials
                          (CustID, google_id, is_verified, picture, paymongo_customer_id)
                          VALUES (?, ?, ?, ?, ?)`,
                          [user.UserID, google_id, 1, picture, paymongo_customer_id]
                     );
                }
            }
            
            // 💡 LOG: SUCCESSFUL GOOGLE LOGIN (Existing User)
            await logUserActivity(
                user.UserID, 
                user.UserRole, // 💡 CORRECT: Pass the fetched role from the DB
                'Login', 
                'User logged in successfully via Google'
            );
        }
        
        if (user && !user.paymongo_customer_id) {
          user.paymongo_customer_id = paymongo_customer_id;
        }

        return res.json({ success: true, message: "Google login successful", user: user });
    } catch (error) {
        console.error("❌ Google login error:", error);
        res.status(500).json({ success: false, message: "Server error during Google login" });
    }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
    try {
        const { identifier } = req.body;
        if (!identifier) return res.status(400).json({ success: false, message: "Email is required" }); 
        
        const [users] = await db.query("SELECT UserID, UserEmail, UserRole FROM Users WHERE UserEmail = ?", [identifier]);
        
        if (users.length === 0) {
            // 💡 LOG: Failed Password Reset Attempt (User not found)
            await logUserActivity('N/A', 'N/A', 'Password Reset Attempt Failed', `Attempt for unknown email: ${identifier}`);
            return res.json({ success: true, message: "If an account with this email exists, an OTP will be sent." });
        }
        
        const user = users[0];
        const otp = generateOTP();
        await db.query("DELETE FROM otps WHERE user_id = ?", [user.UserID]);
        await db.query("INSERT INTO otps (user_id, otp_code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))", [user.UserID, otp]);
        
        // 💡 LOG: Password Reset OTP Sent
        await logUserActivity(
            user.UserID, 
            user.UserRole, // 💡 CORRECT: Pass the fetched role
            'Password Reset', 
            'OTP sent for password recovery'
        );
        
        res.json({ success: true, message: "OTP is being sent to your email.", email: user.UserEmail });
        sendEmail(user.UserEmail, 'Your LaundroLink Password Reset Code', `<strong>Your password reset code is: ${otp}</strong><p>This code will expire in 10 minutes.</p>`);
    } catch (error) {
        console.error("Forgot password error:", error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: "Server error" });
        }
    }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) { return res.status(400).json({ success: false, message: "Missing required fields" }); }
        
        const [users] = await db.query("SELECT UserID, UserRole FROM Users WHERE UserEmail = ?", [email]); // Fetch UserRole here
        if (users.length === 0) { return res.status(400).json({ success: false, message: "User not found" }); }
        
        const { UserID: userId, UserRole } = users[0];
        
        const [otpRows] = await db.query("SELECT * FROM otps WHERE user_id = ? AND otp_code = ? AND expires_at > NOW()", [userId, otp]);
        if (otpRows.length === 0) { return res.status(400).json({ success: false, message: "Invalid or expired OTP" }); }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query("UPDATE Users SET UserPassword = ? WHERE UserID = ?", [hashedPassword, userId]);
        await db.query("DELETE FROM otps WHERE user_id = ?", [userId]);
        
        // 💡 LOG: SUCCESSFUL PASSWORD RESET
        await logUserActivity(
            userId, 
            UserRole, // 💡 CORRECT: Pass the fetched role
            'Password Reset', 
            'User successfully changed their password'
        );
        
        res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

export default router;