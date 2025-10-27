import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { exec } from 'child_process';
// CORRECTED PATH: logger.js is inside the utils folder.
import systemLogger from "./utils/logger.js"; 

dotenv.config();

// Get DB credentials from environment variables
const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;
const DB_PORT = process.env.DB_PORT || 3306;

// Create the MySQL connection pool
const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS, 
    database: DB_NAME,
    port: DB_PORT,
});

/**
 * Executes a MySQL database backup using the mysqldump utility.
 * NOTE: Requires mysqldump to be available in the system's PATH.
 * @param {string} filePath - The absolute path to save the backup file (e.g., C:/.../backups/file.sql).
 * @returns {Promise<boolean>} - Resolves true on successful command execution.
 */
async function runSystemBackup(filePath) {
    // The command runs mysqldump and pipes the output directly to the specified file path.
    const command = `mysqldump -u ${DB_USER} -p${DB_PASS} -h ${DB_HOST} ${DB_NAME} > ${filePath}`;

    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                // Log and reject on critical command failure
                systemLogger.error(`mysqldump execution error: ${error.message}`);
                reject(new Error(`Backup failed: ${error.message}`));
                return;
            }
            if (stderr) {
                // Log stderr content as a warning (often warnings, not fatal errors)
                systemLogger.warn(`mysqldump warnings/stderr: ${stderr}`); 
            }
            // Resolve true if the command executed without critical error
            resolve(true); 
        });
    });
}

// Export the database pool as the default export (used for pool.query())
export default pool;

// Export the utility function as a named export (used in admin.js)
export { runSystemBackup };