# Analytics/system_analytics.py

#!/usr/bin/env python
# coding: utf-8

import mysql.connector
import pandas as pd
from datetime import datetime, timedelta

# ========================
# 1️⃣ Database Connection
# ========================
db_config = {
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "laundrolink_db"
}

try:
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    print("✅ Connected to MySQL database.")
except mysql.connector.Error as err:
    print(f"❌ Database connection failed: {err}")
    exit()

# ===================================================================
# 2️⃣ Create Analytics Tables for Admin Data
# ===================================================================
def create_admin_analytics_tables(cursor):
    """
    Checks for and creates the Admin_Growth_Metrics (KPIs) and Admin_Monthly_Growth (Chart Data) tables.
    """
    print("🔍 Checking and creating Admin analytics tables if needed...")
    
    # --- TEMPORARY FIX: Drop the table to ensure clean recreation with the new schema ---
    # Running this once will fix the mismatch. You can remove it after this successful run.
    cursor.execute("DROP TABLE IF EXISTS Admin_Growth_Metrics;") 

    # Table for storing single-value KPIs (Total Owners, Total Users, etc.)
    # This structure is necessary to support the INSERT...ON DUPLICATE KEY UPDATE logic
    create_growth_table = """
    CREATE TABLE IF NOT EXISTS Admin_Growth_Metrics (
        MetricID INT NOT NULL PRIMARY KEY,   
        totalOwners INT NOT NULL DEFAULT 0,
        activeShops INT NOT NULL DEFAULT 0,
        totalPaymentsProcessed INT NOT NULL DEFAULT 0,
        totalSystemUsers INT NOT NULL DEFAULT 0,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
    """
    
    # Table to store monthly user/owner sign-up data for the chart
    create_monthly_growth_table = """
    CREATE TABLE IF NOT EXISTS Admin_Monthly_Growth (
        MonthYear CHAR(7) NOT NULL PRIMARY KEY, -- Format YYYY-MM
        NewUsers INT NOT NULL DEFAULT 0,
        NewOwners INT NOT NULL DEFAULT 0,
        AnalyzedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
    """
    
    try:
        # 1. Recreate KPI table with correct columns
        cursor.execute(create_growth_table) 
        # 2. Ensure chart data table exists
        cursor.execute(create_monthly_growth_table)
        
        # 3. Insert the required single row (MetricID=1) if it doesn't exist
        # This row is required for the INSERT INTO ... ON DUPLICATE KEY UPDATE logic later.
        cursor.execute("""
            INSERT IGNORE INTO Admin_Growth_Metrics (MetricID) VALUES (1);
        """)
        
        conn.commit()
        print("✅ Admin analytics tables are ready.")
    except mysql.connector.Error as err:
        print(f"❌ Error creating admin analytics tables: {err}")
        exit()

create_admin_analytics_tables(cursor)


# ===================================================================
# 3️⃣ Calculate Monthly Growth for Chart
# ===================================================================
print("📈 Calculating monthly user growth...")

# Calculate new users and owners per month for the last 12 months
one_year_ago = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')

# Using the dictionary cursor temporarily for pandas compatibility
cursor_dict = conn.cursor(dictionary=True)

# **FIXED COLUMN NAME: Using 'DateCreated' as requested**
growth_query = f"""
SELECT 
    DATE_FORMAT(DateCreated, '%Y-%m') as MonthYear,
    UserRole,
    COUNT(UserID) as Count
FROM Users
WHERE DateCreated >= '{one_year_ago}' AND UserRole IN ('Customer', 'Shop Owner')
GROUP BY MonthYear, UserRole
ORDER BY MonthYear;
"""

try:
    df = pd.read_sql(growth_query, conn)
except pd.io.sql.DatabaseError as e:
    print(f"❌ Error fetching growth data: {e}")
    conn.close()
    exit()

# Pivot data to get separate columns for NewUsers and NewOwners
growth_pivot = df.pivot_table(
    index='MonthYear', 
    columns='UserRole', 
    values='Count', 
    fill_value=0
).reset_index()

# Rename columns for clarity in the database
growth_pivot.columns.name = None
growth_pivot = growth_pivot.rename(columns={
    'Customer': 'NewUsers', 
    'Shop Owner': 'NewOwners'
})

# Ensure the required columns exist, handling cases where a user type had zero sign-ups
if 'NewUsers' not in growth_pivot.columns:
    growth_pivot['NewUsers'] = 0
if 'NewOwners' not in growth_pivot.columns:
    growth_pivot['NewOwners'] = 0

# Store in MySQL: First, clear the old data
cursor.execute("TRUNCATE TABLE Admin_Monthly_Growth;")
for _, row in growth_pivot.iterrows():
    cursor.execute("""
        INSERT INTO Admin_Monthly_Growth (MonthYear, NewUsers, NewOwners)
        VALUES (%s, %s, %s)
    """, (row['MonthYear'], int(row['NewUsers']), int(row['NewOwners'])))

conn.commit()
print("✅ Monthly Growth metrics updated successfully.")
cursor_dict.close() # Close dictionary cursor


# ===================================================================
# 4️⃣ Calculate KPIs (Total Counts)
# ===================================================================
print("📊 Calculating Admin KPIs...")

# Complex query to get all KPIs in one go
# **FIXED TABLE NAME: Using Invoices and Invoice_Status for totalPaymentsProcessed**
kpi_query = """
INSERT INTO Admin_Growth_Metrics (MetricID, totalOwners, activeShops, totalPaymentsProcessed, totalSystemUsers)
VALUES (
    1,
    (SELECT COUNT(OwnerID) FROM Shop_Owners),
    (
        SELECT COUNT(DISTINCT o.ShopID) 
        FROM Orders o
        JOIN Order_Status os ON o.OrderID = os.OrderID
        WHERE os.OrderStatus = 'Completed' 
        AND os.OrderUpdatedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    ),
    (
        SELECT COUNT(t1.InvoiceID)
        FROM Invoices AS t1
        JOIN Invoice_Status AS t2 ON t1.InvoiceID = t2.InvoiceID
        WHERE t2.InvoiceStatus = 'Paid' 
    ),
    (SELECT COUNT(UserID) FROM Users)
)
ON DUPLICATE KEY UPDATE
    totalOwners = VALUES(totalOwners),
    activeShops = VALUES(activeShops),
    totalPaymentsProcessed = VALUES(totalPaymentsProcessed),
    totalSystemUsers = VALUES(totalSystemUsers),
    updatedAt = NOW();
"""

try:
    cursor.execute(kpi_query)
    conn.commit()
    print("✅ Admin KPIs updated successfully.")
except mysql.connector.Error as err:
    print(f"❌ Error calculating Admin KPIs: {err}")
    conn.rollback()


# ========================
# ✅ FINISH
# ========================
cursor.close()
conn.close()
print("\n🎯 System analytics processing complete! Admin metrics are live in MySQL. Run this script manually before checking the dashboard.")