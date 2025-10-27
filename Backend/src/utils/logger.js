// utils/logger.js (UPDATE THIS FILE)

import db from '../db.js'; // Your database connection module

/**
 * Logs an activity into the User_Logs table.
 * @param {string} UserID - The ID of the user performing the action.
 * @param {string} UserRole - 💡 NEW: The role of the user (e.g., 'Admin', 'Customer').
 * @param {string} UsrLogAction - The type of action (e.g., 'Login', 'Update', 'Delete').
 * @param {string} UsrLogDescrpt - A detailed description of the action.
 */
export async function logUserActivity(UserID, UserRole, UsrLogAction, UsrLogDescrpt) {
    try {
        const sql = `
            INSERT INTO User_Logs (UserID, UserRole, UsrLogAction, UsrLogDescrpt)
            VALUES (?, ?, ?, ?);
        `;
        // Execute the insertion query, passing the new UserRole
        await db.query(sql, [UserID, UserRole, UsrLogAction, UsrLogDescrpt]);
        // console.log(`Activity logged for UserID ${UserID}: ${UsrLogAction}`);
    } catch (error) {
        console.error("CRITICAL: Failed to insert user log entry.", error);
    }
}