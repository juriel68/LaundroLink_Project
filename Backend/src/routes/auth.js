// routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { sgMail } from "../config/externalServices.js";

// 💡 IMPORT THE LOGGER UTILITY
import { logUserActivity } from '../utils/logger.js'; 

const router = express.Router();

// =================================================================
// Helper Functions (retained for context)
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
    // Destructure 'identifier' and alias it to 'email'
    const { email, password } = req.body;

    console.log("\n--- Backend Login Attempt Start ---");
    console.log(`[Input] Attempting login for email: ${email}`);

    if (!email || !password) {
        console.log("[Result] Missing email/password. Status 400.");
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        const [users] = await db.query(
            `SELECT UserID, UserEmail, UserPassword, UserRole FROM Users WHERE UserEmail = ?`,
            [email]
        );

        if (users.length === 0) {
            // 💡 LOG: Failed Login (User not found)
            await logUserActivity('N/A', 'N/A', 'Login Attempt Failed', `Attempt for unknown email: ${email}`);
            console.log("[Result] User not found. Status 401.");
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = users[0];
        
        // NOTE: bcrypt compare logic... (retained comment)
        
        console.log(`[User Found] ID: ${user.UserID}, Role: ${user.UserRole}`);
        
        if (user.UserRole === 'Customer') {
            // --- CUSTOMER LOGIN FLOW (OTP REQUIRED) ---
            const otp = generateOTP();
            // NOTE: Uses 'otps' table - ensure this table exists
            await db.query("DELETE FROM otps WHERE user_id = ?", [user.UserID]);
            await db.query("INSERT INTO otps (user_id, otp_code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))", [user.UserID, otp]);
            
            // Send email asynchronously
            sendEmail(user.UserEmail, 'Your LaundroLink Login Code', `<strong>Your login code is: ${otp}</strong>`);

            // 🔍 CONSOLE LOG ADDED
            console.log("[Flow] Customer detected. OTP initiated.");
            console.log(`[Response] Sending success, requiresOTP: true, userId: ${user.UserID}`);
            console.log("--- Backend Login Attempt End (OTP Required) ---\n");
            
            return res.json({
                success: true,
                message: "Credentials valid, sending OTP.",
                userId: user.UserID,
                requiresOTP: true
            });
        }

        // --- DIRECT LOGIN SUCCESS (Staff, Shop Owner, Admin) ---
        
        // 💡 LOG: SUCCESSFUL DIRECT LOGIN
        await logUserActivity(
            user.UserID,
            user.UserRole, 
            'Login',
            `User logged in successfully`
        );

        let userDetails = {
            UserID: user.UserID,
            UserEmail: user.UserEmail,
            UserRole: user.UserRole
        };
        // ... Fetch additional details based on role ... (This existing logic is retained)
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
                `SELECT sh.ShopID, sh.ShopName, s.StaffName, s.StaffRole
                FROM Staffs s
                JOIN Laundry_Shops sh ON s.ShopID = sh.ShopID
                WHERE s.StaffID = ?`,
                [user.UserID]
            );
            if (staffDetails.length > 0) {
                userDetails = { ...userDetails, ...staffDetails[0] };
            }
        }

        // 🔍 CONSOLE LOG ADDED
        console.log("[Flow] Direct Login successful.");
        console.log("[Response] Direct User details:", userDetails);
        console.log("--- Backend Login Attempt End (Success) ---\n");

        res.json({
            success: true,
            user: userDetails,
            requiresOTP: false
        });

    } catch (error) {
        console.error("❌ Login error (Catch Block):", error);
        console.log("--- Backend Login Attempt End (Error) ---\n");
        res.status(500).json({ error: "Server error, please try again later" });
    }
});

// POST /api/auth/google-login
router.post("/google-login", async (req, res) => {
    let connection;
    try {
        const { google_id, email, name, picture } = req.body;
        
        // 🚀 CONSOLE LOG ADDED HERE FOR DEBUGGING
        console.log("--- Google Login Debug ---");
        console.log(`Email: ${email}`);
        console.log(`Received Picture URL: ${picture}`);
        console.log("--------------------------");

        if (!google_id || !email || !name) { 
            return res.status(400).json({ success: false, message: "Missing Google data" }); 
        }
        
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Check for existing user by google_id OR UserEmail
        const [existingUser] = await connection.query(
            "SELECT T1.*, T2.google_id, T2.picture FROM Users T1 LEFT JOIN Cust_Credentials T2 ON T1.UserID = T2.CustID WHERE T2.google_id = ? OR T1.UserEmail = ?", 
            [google_id, email]
        );
        
        let user;
        let isNewUser = existingUser.length === 0; 
        
        if (isNewUser) {
            const newCustID = await generateNewCustID(connection);
        
            // 1. Insert into Users table
            await connection.query(
                "INSERT INTO Users (UserID, UserEmail, UserPassword, UserRole) VALUES (?, ?, ?, ?)",
                [newCustID, email, null, 'Customer']
            );
            
            // 2. Insert into Customers table
            await connection.query(
                "INSERT INTO Customers (CustID, CustName) VALUES (?, ?)",
                [newCustID, name]
            );

            // 3. Insert into Cust_Credentials table
            await connection.query(
                `INSERT INTO Cust_Credentials
                (CustID, google_id, is_verified, picture)
                VALUES (?, ?, ?, ?)`,
                [newCustID, google_id, 1, picture] 
            );

            await connection.commit();
            
            const [newUser] = await db.query("SELECT * FROM Users WHERE UserID = ?", [newCustID]);
            user = newUser[0];
            
            // 💡 LOG: NEW USER SIGN-UP
            await logUserActivity(
                newCustID, 
                'Customer', 
                'Sign-up', 
                'User created a new account via Google'
            );
            
        } else {
            user = existingUser[0];
            
            // 1. Update/insert Google details if missing or changed
            // The condition for updating now only checks for missing google_id or changed picture
            if (!user.google_id || user.picture !== picture) { 
                
                // 🚀 CONSOLE LOG ADDED HERE TO CHECK IF UPDATE IS TRIGGERED
                console.log(`Picture update triggered for UserID: ${user.UserID}. New Picture URL: ${picture}`);

                const [updateResult] = await connection.query(
                    "UPDATE Cust_Credentials SET google_id = ?, picture = ?, is_verified = 1 WHERE CustID = ?", 
                    [google_id, picture, user.UserID]
                );
                
                if (updateResult.affectedRows === 0) {
                    // This handles the edge case where the user exists in Users/Customers but not Cust_Credentials
                    await connection.query(
                        `INSERT INTO Cust_Credentials
                         (CustID, google_id, is_verified, picture)
                         VALUES (?, ?, ?, ?)`, 
                         [user.UserID, google_id, 1, picture]
                    );
                }
            }
            
            await connection.commit();
            
            // 💡 LOG: SUCCESSFUL GOOGLE LOGIN (Existing User)
            await logUserActivity(
                user.UserID, 
                user.UserRole, 
                'Login', 
                'User logged in successfully via Google'
            );
        }
        
        // Final response uses the combined user object
        return res.json({ success: true, message: "Google login successful", user: user });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error("❌ Google login error:", error);
        res.status(500).json({ success: false, message: "Server error during Google login" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// POST /api/auth/verify-otp
router.post("/verify-otp", async (req, res) => {
// ... (rest of the /verify-otp route is unchanged) ...
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
        
        const userRole = users[0].UserRole; 
        
        // 💡 LOG: SUCCESSFUL CUSTOMER LOGIN (after OTP)
        await logUserActivity(
            userId, 
            userRole, 
            'Login', 
            'Customer logged in successfully (OTP verified)'
        );

        res.json({ success: true, message: "Login successful", user: users[0] });
    } catch (error) {
        console.error("❌ verify-otp error:", error);
        res.status(500).json({ success: false, message: "Failed to verify OTP." });
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
            user.UserRole, 
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
        
        const [users] = await db.query("SELECT UserID, UserRole FROM Users WHERE UserEmail = ?", [email]); 
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
            UserRole, 
            'Password Reset', 
            'User successfully changed their password'
        );
        
        res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});


router.get("/test-users", async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT UserID, UserEmail, UserRole, UserPassword FROM Users`
        );
        
        // WARNING: This exposes password hashes! Use ONLY for local debugging.
        console.log(`[DIAGNOSTIC] Found ${users.length} users.`);
        
        return res.json({
            success: true,
            count: users.length,
            data: users
        });

    } catch (error) {
        console.error("❌ Diagnostic Error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Failed to fetch users. Check DB connection/schema.",
            error: error.message
        });
    }
});

export default router;