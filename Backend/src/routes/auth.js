import express from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { paymongo, sgMail } from "../config/services.js";

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

// Finds the largest numeric part of an existing CustID (e.g., extracts '7' from 'C7')
// and returns the next sequential ID (e.g., 'C8').
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
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) { return res.status(400).json({ message: "Missing fields" }); }

        // FIX: Search only by UserEmail, as phone is in the separate Customers table
        const [users] = await db.query("SELECT * FROM Users WHERE UserEmail = ?", [identifier]);
        if (users.length === 0) { return res.status(400).json({ message: "User not found" }); }

        const user = users[0];
        
        // FIX: Use UserPassword column from the database
        if (!user.UserPassword) { 
            return res.status(400).json({ message: "This account was created with Google. Please sign in with Google or set a password in your profile." });
        }

        // FIX: Compare against UserPassword
        const match = await bcrypt.compare(password, user.UserPassword);
        if (!match) { return res.status(400).json({ message: "Invalid credentials" }); }
        
        const otp = generateOTP();
        await db.query("DELETE FROM otps WHERE user_id = ?", [user.UserID]);
        await db.query("INSERT INTO otps (user_id, otp_code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))", [user.UserID, otp]);

        res.json({ success: true, message: "Credentials valid, sending OTP.", userId: user.UserID });

        // FIX: Use UserEmail for sending email
        sendEmail(user.UserEmail, 'Your LaundroLink Login Code', `<strong>Your login code is: ${otp}</strong>`);
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// POST /api/auth/verify-otp
router.post("/verify-otp", async (req, res) => {
    try {
        const { userId, otp } = req.body;
        if (!userId || !otp) { return res.status(400).json({ success: false, message: "User ID and OTP are required." }); }

        const [otpRows] = await db.query("SELECT * FROM otps WHERE user_id = ? AND otp_code = ? AND expires_at > NOW()", [userId, otp]);
        if (otpRows.length === 0) { return res.status(400).json({ success: false, message: "Invalid or expired OTP." }); }

        await db.query("DELETE FROM otps WHERE user_id = ?", [userId]);

        const [users] = await db.query("SELECT * FROM Users WHERE UserID = ?", [userId]);
        if (users.length === 0) { return res.status(404).json({ success: false, message: "User not found after verification." }); }

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
        
        // FIX: Join Users and Cust_Credentials for proper lookup
        const [existingUser] = await db.query(
            "SELECT T1.*, T2.google_id, T2.picture, T2.paymongo_customer_id FROM Users T1 LEFT JOIN Cust_Credentials T2 ON T1.UserID = T2.CustID WHERE T2.google_id = ? OR T1.UserEmail = ?", 
            [google_id, email]
        );
        
        let user;
        let paymongo_customer_id = null; // Initialize as null
        
        if (existingUser.length > 0) {
            user = existingUser[0];
            // Get the existing paymongo_customer_id if it exists
            paymongo_customer_id = user.paymongo_customer_id;

            // ✅ FIX: If the user exists but the google_id or picture are missing, update the credentials
            if (!user.google_id || user.picture !== picture) {
                // Determine if we need to INSERT or UPDATE in Cust_Credentials. 
                // We'll try to update first, and if nothing changes (0 affected rows), we insert.
                
                const [updateResult] = await db.query(
                    "UPDATE Cust_Credentials SET google_id = ?, picture = ?, is_verified = 1 WHERE CustID = ?",
                    [google_id, picture, user.UserID]
                );
                
                // If update didn't work (Cust_Credentials entry was missing for this UserID)
                if (updateResult.affectedRows === 0) {
                     await db.query(
                        `INSERT INTO Cust_Credentials(CustID, google_id, is_verified, picture, paymongo_customer_id)
                        VALUES (?, ?, ?, ?, ?)`,
                        [user.UserID, google_id, 1, picture, paymongo_customer_id]
                    );
                }
            }

        } else {
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
            
            // ❌ COMMENTED OUT: Paymongo Customer Creation (We keep this disabled)
            /*
            const { firstName, lastName } = splitName(name);
            const paymongoCustomer = await paymongo.customers.create({ 
                 first_name: firstName, 
                 last_name: lastName, 
                 email: email 
            });
            paymongo_customer_id = paymongoCustomer.data.id;
            */
            
            await db.query(
                `INSERT INTO Cust_Credentials 
                 (CustID, google_id, is_verified, picture, paymongo_customer_id) 
                 VALUES (?, ?, ?, ?, ?)`,
                // paymongo_customer_id will be NULL here
                [newCustID, google_id, 1, picture, paymongo_customer_id] 
            );

            const [newUser] = await db.query("SELECT * FROM Users WHERE UserID = ?", [newCustID]);
            user = newUser[0];
        }
        
        // Inject paymongo_customer_id into the user object before sending it to the frontend
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
        // FIX: Updated message to reflect search by email only
        if (!identifier) return res.status(400).json({ success: false, message: "Email is required" }); 
        
        // FIX: Search only by UserEmail
        const [users] = await db.query("SELECT UserID, UserEmail FROM Users WHERE UserEmail = ?", [identifier]);
        if (users.length === 0) {
            return res.json({ success: true, message: "If an account with this email exists, an OTP will be sent." });
        }
        const user = users[0];
        const otp = generateOTP();
        await db.query("DELETE FROM otps WHERE user_id = ?", [user.UserID]);
        await db.query("INSERT INTO otps (user_id, otp_code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))", [user.UserID, otp]);
        
        // FIX: Use UserEmail from DB
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
        
        // FIX: Search only by UserEmail
        const [users] = await db.query("SELECT UserID FROM Users WHERE UserEmail = ?", [email]);
        if (users.length === 0) { return res.status(400).json({ success: false, message: "User not found" }); }
        
        const userId = users[0].UserID;
        const [otpRows] = await db.query("SELECT * FROM otps WHERE user_id = ? AND otp_code = ? AND expires_at > NOW()", [userId, otp]);
        if (otpRows.length === 0) { return res.status(400).json({ success: false, message: "Invalid or expired OTP" }); }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        // FIX: Use UserPassword column for update
        await db.query("UPDATE Users SET UserPassword = ? WHERE UserID = ?", [hashedPassword, userId]);
        await db.query("DELETE FROM otps WHERE user_id = ?", [userId]);
        res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

export default router;