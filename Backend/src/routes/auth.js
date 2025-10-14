import express from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { paymongo, sgMail } from "../config/services.js";

const router = express.Router();
const otp = "123456"; 

// =================================================================
// Helper Functions
// =================================================================

function generateOTP() {
    return otp;
    //return Math.floor(100000 + Math.random() * 900000).toString();
}

function splitName(fullName) {
    const nameParts = (fullName || '').trim().split(' ');
    const firstName = nameParts.shift() || 'User';
    const lastName = nameParts.join(' ') || firstName;
    return { firstName, lastName };
}

// Finds the largest numeric part of an existing CustID (e.g., extracts '7' from 'C7')
// and returns the next sequential ID (e.g., 'C8').
async function generateNewCustID(connection) {
    // 1. Query the largest numeric part of existing CustIDs
    const [rows] = await connection.query(
        `SELECT MAX(CAST(SUBSTRING(CustID, 2) AS UNSIGNED)) AS last_id_number
         FROM Customers
         WHERE CustID LIKE 'C%'`
    );

    let nextIdNumber = 1;
    if (rows.length > 0 && rows[0].last_id_number !== null) {
        // If a number is found (e.g., 7), increment it (to 8)
        nextIdNumber = rows[0].last_id_number + 1;
    } 

    // Return the new ID (e.g., 'C8')
    return 'C' + nextIdNumber.toString();
}

async function sendEmail(to, subject, html) {
    const msg = {
        to: to,
        from: 'your-verified-sendgrid-email@example.com', // IMPORTANT: Replace with your verified SendGrid sender email
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
// API Routes
// =================================================================

// POST /api/auth/login
// Handles standard login with email/phone and password, then sends an OTP.
router.post("/login", async (req, res) => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) {
            return res.status(400).json({ message: "Email/Phone and password are required." });
        }

        // Note: Assumes a 'Users' table and 'Phone' column exists for staff/owners.
        const [users] = await db.query(
            "SELECT * FROM Users WHERE UserRole = 'Customer' AND UserEmail = ?  ",
            [identifier]
        );
        if (users.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const user = users[0];

        // This handles Google-only accounts trying to log in with a password.
        if (!user.UserPassword) {
            return res.status(400).json({ message: "This account was created with Google. Please sign in with Google." });
        }

        // Direct password comparison, as per your schema's sample data.
        // For hashed passwords, you would use: const match = await bcrypt.compare(password, user.UserPassword);
        const match = (password === user.UserPassword);
        if (!match) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        // Generate and send OTP for 2-Factor Authentication
        const otp = generateOTP();
        await db.query("DELETE FROM otps WHERE user_id = ?", [user.UserID]);
        await db.query(
            "INSERT INTO otps (user_id, otp_code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))",
            [user.UserID, otp]
        );

        res.json({ success: true, message: "Credentials valid, sending OTP.", userId: user.UserID });

        // Asynchronously send the email
        //sendEmail(user.UserEmail, 'Your LaundroLink Login Code', `<strong>Your login verification code is: ${otp}</strong>`);

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error during login." });
    }
});

// POST /api/auth/verify-otp
// Verifies the OTP and returns the full user object on success.
router.post("/verify-otp", async (req, res) => {
    try {
        const { userId, otp } = req.body;
        if (!userId || !otp) {
            return res.status(400).json({ success: false, message: "User ID and OTP are required." });
        }

        console.log(`🚀 [verify-otp] Attempting verification for User ID: ${userId} with OTP: ${otp}`);
        console.log(`[DEBUG] Received OTP details: Type: ${typeof otp}, Length: ${otp.length}`);
        
        // DEBUG: Check all active OTPs for this user
        const [debugOtps] = await db.query(
            "SELECT otp_code, expires_at FROM otps WHERE user_id = ? AND expires_at > NOW()",
            [userId]
        );
        console.log("[DEBUG] Active (non-expired) OTPs in DB for this user:", debugOtps);

        const [otpRows] = await db.query(
            "SELECT * FROM otps WHERE user_id = ? AND otp_code = ? AND expires_at > NOW()",
            [userId, otp]
        );
        if (otpRows.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
        }

        // Clean up the used OTP
        await db.query("DELETE FROM otps WHERE user_id = ?", [userId]);

        const [users] = await db.query(
            `SELECT
                U.UserID, U.UserEmail, U.UserRole, U.DateCreated,
                C.CustName,
                CR.google_id, CR.is_verified, CR.picture, CR.paymongo_customer_id, CR.provider
            FROM Users U
            JOIN Customers C ON U.UserID = C.CustID
            LEFT JOIN Cust_Credentials CR ON U.UserID = CR.CustID
            WHERE U.UserID = ?`, 
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: "User not found after verification." });
        }
        
        // On successful verification, return the user object
        res.json({ success: true, message: "Login successful", user: users[0] });

    } catch (error) {
        console.error("❌ verify-otp error:", error);
        res.status(500).json({ success: false, message: "Failed to verify OTP." });
    }
});

// Handles user sign-in or sign-up via Google OAuth.
router.post("/google-login", async (req, res) => {
    let connection;
    try {
        const { google_id, email, name, picture } = req.body;
        if (!google_id || !email || !name) {
            return res.status(400).json({ success: false, message: "Missing required Google data." });
        }

        // 1. Check for existing user by google_id OR email
        const [userCheck] = await db.query(
            `SELECT U.UserID FROM Users U
             LEFT JOIN Cust_Credentials CR ON U.UserID = CR.CustID
             WHERE CR.google_id = ? OR U.UserEmail = ?`, 
            [google_id, email]
        );
        
        let userId;

        if (userCheck.length > 0) {
            // User exists - Sign in flow
            userId = userCheck[0].UserID;
        } else {
            // New user - Sign up flow
            
            // Use a transaction for multi-table insertion
            connection = await db.getConnection();
            await connection.beginTransaction();

            const newUserId = await generateNewCustID(connection);
            
            const { firstName, lastName } = splitName(name);

            // --- PayMongo Customer Creation ---
            let paymongoCustomerId = null; 
            
            try {
                // FIX 1: Re-adding a mandatory field with a valid string value
                const customer = await paymongo.customers.create({ 
                    first_name: firstName, 
                    last_name: lastName, 
                    email: email,
                    // Use a valid string identifier for the device/app
                    default_device: "web_app"
                });
                
                // Set the ID only if customer creation succeeded
                paymongoCustomerId = customer.data.id;
                console.log(`✅ PayMongo Customer created: ${paymongoCustomerId}`);
                
            } catch (paymongoError) {
                // If PayMongo fails, paymongoCustomerId remains NULL, and the process continues.
                console.error("❌ PayMongo customer creation failed. Proceeding with NULL ID.", paymongoError);
            }

            // 2. Insert into Users table
            await connection.query(
                "INSERT INTO Users (UserID, UserEmail, UserRole, UserPassword) VALUES (?, ?, 'Customer', '')",
                [newUserId, email]
            );

            // 3. Insert into Customers table
            await connection.query(
                "INSERT INTO Customers (CustID, CustName) VALUES (?, ?)",
                [newUserId, name] 
            );
            
            // 4. Insert into Cust_Credentials table
            // FIX 2: Using the safety variable `paymongoCustomerId` (which is either a string ID or null) 
            // instead of the potentially undefined `customer.data.id`.
            await connection.query(
                `INSERT INTO Cust_Credentials (CustID, google_id, is_verified, picture, provider, paymongo_customer_id) 
                 VALUES (?, ?, 1, ?, 'google', ?)`,
                [newUserId, google_id, picture, paymongoCustomerId]
            );

            await connection.commit();
            userId = newUserId;
        }
        
        // 5. Fetch the complete user object (for both existing and new users)
        const [users] = await db.query(
            `SELECT
                U.UserID, U.UserEmail, U.UserRole, U.DateCreated,
                C.CustName,
                CR.google_id, CR.is_verified, CR.picture, CR.paymongo_customer_id, CR.provider
            FROM Users U
            JOIN Customers C ON U.UserID = C.CustID
            LEFT JOIN Cust_Credentials CR ON U.UserID = CR.CustID
            WHERE U.UserID = ?`, 
            [userId]
        );

        const user = users.length > 0 ? users[0] : null;

        if (!user) {
            // If the user was just created, this indicates a serious database issue (e.g., query failure).
             throw new Error("Failed to retrieve complete user profile after login/signup.");
        }
        
        return res.json({ success: true, message: "Google login successful", user: user });

    } catch (error) {
        if (connection) await connection.rollback(); // Rollback on error
        console.error("❌ Google login error (500):", error); 
        res.status(500).json({ success: false, message: "Server error during Google login. Check backend logs for details." });
    } finally {
        if (connection) connection.release();
    }
});

// POST /api/auth/forgot-password
// Sends a password reset OTP to the user's email.
router.post("/forgot-password", async (req, res) => {
    try {
        const { identifier } = req.body;
        if (!identifier) {
            return res.status(400).json({ success: false, message: "Email or phone is required." });
        }

        const [users] = await db.query(
            "SELECT UserID, UserEmail FROM Users WHERE UserEmail = ?",
            [identifier]
        );

        // Always return a success message to prevent user enumeration attacks
        if (users.length === 0) {
            return res.json({ success: true, message: "If an account with this email exists, a reset code will be sent." });
        }
        
        const user = users[0];
        const otp = generateOTP();

        await db.query("DELETE FROM otps WHERE user_id = ?", [user.UserID]);
        await db.query(
            "INSERT INTO otps (user_id, otp_code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))",
            [user.UserID, otp]
        );

        res.json({ success: true, message: "OTP is being sent to your email.", email: user.UserEmail });
        
        sendEmail(user.UserEmail, 'Your LaundroLink Password Reset Code', `<strong>Your password reset code is: ${otp}</strong><p>This code will expire in 10 minutes.</p>`);
    
    } catch (error) {
        console.error("Forgot password error:", error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: "Server error." });
        }
    }
});

// POST /api/auth/reset-password
// Verifies OTP and updates the user's password.
router.post("/reset-password", async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        const [users] = await db.query("SELECT UserID FROM Users WHERE UserEmail = ?", [email]);
        if (users.length === 0) {
            return res.status(400).json({ success: false, message: "User not found." });
        }
        
        const userId = users[0].UserID;
        const [otpRows] = await db.query(
            "SELECT * FROM otps WHERE user_id = ? AND otp_code = ? AND expires_at > NOW()",
            [userId, otp]
        );
        if (otpRows.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
        }

        // In a real app with hashing: const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query("UPDATE Users SET UserPassword = ? WHERE UserID = ?", [newPassword, userId]);
        await db.query("DELETE FROM otps WHERE user_id = ?", [userId]);

        res.json({ success: true, message: "Password reset successfully." });

    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

export default router;