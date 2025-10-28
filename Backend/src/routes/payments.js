// src/routes/payments.js
import express from "express";
import db from "../db.js"; // Ensure this path correctly points to your db utility

const router = express.Router();

/**
 * @route GET /api/payments/admin
 * @description Admin endpoint to fetch and filter all PAID payments by shop and date range.
 * @queryParam {string} [shopId] - Optional ShopID to filter by.
 * @queryParam {string} [startDate] - Optional start date for the PaidAt filter (YYYY-MM-DD).
 * @queryParam {string} [endDate] - Optional end date for the PaidAt filter (YYYY-MM-DD).
 */
router.get("/admin", async (req, res) => {
    const { shopId, startDate, endDate } = req.query;

    const queryParams = [];
    let shopFilter = '';
    let dateFilter = '';

    // 1. Build Shop Filter
    if (shopId) {
        shopFilter = 'AND LS.ShopID = ?';
        queryParams.push(shopId);
    }

    // 2. Build Date Range Filter (using PaidAt)
    // The date filter is crucial for the "Date" requirement. We use PaidAt as it represents the payment completion date.
    if (startDate && endDate) {
        // Use DATE_ADD to make the endDate inclusive up to the last millisecond of the day
        dateFilter = 'AND IRS.PaidAt BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)';
        queryParams.push(startDate, endDate);
    } else if (startDate) {
        // Filter for a single entire day if only startDate is provided
        dateFilter = 'AND IRS.PaidAt >= ? AND IRS.PaidAt < DATE_ADD(?, INTERVAL 1 DAY)';
        queryParams.push(startDate, startDate);
    }

    try {
        const query = `
            SELECT
                C.CustName AS customerName,
                LS.ShopName AS shopName,
                I.PayAmount AS amount,
                PM.MethodName AS paymentMethod,
                IRS.PaidAt AS dateCompleted,
                IRS.InvoiceStatus AS status,
                O.OrderID AS orderId
            FROM
                Invoices I
            JOIN
                Invoice_Status IRS ON I.InvoiceID = IRS.InvoiceID
            JOIN
                Orders O ON I.OrderID = O.OrderID
            JOIN
                Customers C ON O.CustID = C.CustID
            JOIN
                Laundry_Shops LS ON O.ShopID = LS.ShopID
            JOIN
                Payment_Methods PM ON I.MethodID = PM.MethodID
            WHERE
                IRS.InvoiceStatus = 'Paid' -- Base condition: Only show successfully processed payments
                ${shopFilter}
                ${dateFilter}
            ORDER BY
                IRS.PaidAt DESC;
        `;

        // Execute the query with the dynamically built parameters
        const [payments] = await db.query(query, queryParams);
        
        res.status(200).json(payments);
    } catch (error) {
        console.error("Error fetching admin payments:", error);
        res.status(500).json({ error: "Failed to fetch payment data" });
    }
});

/**
 * @route GET /api/payments/shops
 * @description Utility endpoint to fetch the list of shops for the filter dropdown.
 */
router.get("/shops", async (req, res) => {
    try {
        const query = `
            SELECT 
                ShopID, 
                ShopName 
            FROM 
                Laundry_Shops 
            ORDER BY 
                ShopName ASC;
        `;
        const [shops] = await db.query(query);
        // Returns [{ ShopID: 'SH01', ShopName: 'Wash n’ Dry - Lahug' }, ...]
        res.status(200).json(shops);
    } catch (error) {
        console.error("Error fetching shops for filter:", error);
        res.status(500).json({ error: "Failed to fetch shop list" });
    }
});

export default router;