# In[1]:

#!/usr/bin/env python
# coding: utf-8

import mysql.connector
import pandas as pd
from datetime import datetime

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
    cursor = conn.cursor(dictionary=True)
    print("✅ Connected to MySQL database.")
except mysql.connector.Error as err:
    print(f"❌ Database connection failed: {err}")
    exit()

# ===================================================================
# ✅ NEW: Helper function to create analytics tables if they don't exist
# ===================================================================
def create_analytics_tables(cursor):
    """
    Checks for and creates the necessary analytics tables if they are missing.
    """
    print("🔍 Checking and creating analytics tables if needed...")
    
    # Define the structure for the Customer_Segments table
    create_segments_table = """
    CREATE TABLE IF NOT EXISTS Customer_Segments (
        ShopID VARCHAR(10) NOT NULL,
        SegmentName VARCHAR(50) NOT NULL,
        customerCount INT,
        averageSpend DECIMAL(10, 2),
        averageFrequency DECIMAL(10, 2),
        averageRecency DECIMAL(10, 2),
        SegmentedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (ShopID, SegmentName),
        FOREIGN KEY (ShopID) REFERENCES Laundry_Shop(ShopID) ON DELETE CASCADE
    );
    """
    
    # Define the structure for the Shop_Popular_Services table
    create_popular_services_table = """
    CREATE TABLE IF NOT EXISTS Shop_Popular_Services (
        ShopID VARCHAR(10) NOT NULL,
        SvcName VARCHAR(50) NOT NULL,
        orderCount INT,
        AnalyzedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (ShopID, SvcName),
        FOREIGN KEY (ShopID) REFERENCES Laundry_Shop(ShopID) ON DELETE CASCADE
    );
    """
    
    # Define the structure for the Shop_Busiest_Times table
    create_busiest_times_table = """
    CREATE TABLE IF NOT EXISTS Shop_Busiest_Times (
        ShopID VARCHAR(10) NOT NULL,
        timeSlot VARCHAR(50) NOT NULL,
        orderCount INT,
        AnalyzedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (ShopID, timeSlot),
        FOREIGN KEY (ShopID) REFERENCES Laundry_Shop(ShopID) ON DELETE CASCADE
    );
    """
    
    try:
        cursor.execute(create_segments_table)
        cursor.execute(create_popular_services_table)
        cursor.execute(create_busiest_times_table)
        print("✅ Analytics tables are ready.")
    except mysql.connector.Error as err:
        print(f"❌ Error creating analytics tables: {err}")
        exit()

# ===================================================================
# ✅ NEW: Call the function to ensure tables exist
# ===================================================================
create_analytics_tables(cursor)


# ========================
# 2️⃣ Load Order Data
# ========================
query = """
SELECT 
    o.OrderID, o.ShopID, o.CustID, 
    i.PayAmount, o.OrderCreatedAt, s.SvcName
FROM Orders o
JOIN Service s ON o.SvcID = s.SvcID
JOIN Invoice i ON o.OrderID = i.OrderID
JOIN (
    SELECT OrderID, MAX(OrderUpdatedAt) AS LatestUpdate
    FROM Order_Status
    GROUP BY OrderID
) latest ON o.OrderID = latest.OrderID
JOIN Order_Status os ON os.OrderID = latest.OrderID AND os.OrderUpdatedAt = latest.LatestUpdate
WHERE os.OrderStatus = 'Completed';
"""
df = pd.read_sql(query, conn)

if df.empty:
    print("⚠️ No completed orders found.")
    exit()

# ========================
# 3️⃣ CUSTOMER SEGMENTATION
# ========================
print("📊 Generating customer segmentation...")

# Calculate Recency, Frequency, and Monetary (RFM)
df['OrderCreatedAt'] = pd.to_datetime(df['OrderCreatedAt'])
now = datetime.now()
rfm = df.groupby(['ShopID', 'CustID']).agg({
    'OrderCreatedAt': lambda x: (now - x.max()).days,   # Recency
    'OrderID': 'count',                                 # Frequency
    'PayAmount': 'mean'                                 # Monetary
}).reset_index()

rfm.columns = ['ShopID', 'CustID', 'Recency', 'Frequency', 'Monetary']

# Simple segmentation logic
def label_segment(row):
    if row['Frequency'] >= 5 and row['Monetary'] >= 500:
        return 'Loyal High-Spender'
    elif row['Frequency'] >= 3:
        return 'Frequent Customer'
    elif row['Recency'] <= 14:
        return 'Recent Customer'
    else:
        return 'Occasional'

rfm['SegmentName'] = rfm.apply(label_segment, axis=1)

# Aggregate by shop and segment
segment_summary = rfm.groupby(['ShopID', 'SegmentName']).agg({
    'CustID': 'count',
    'Monetary': 'mean',
    'Frequency': 'mean',
    'Recency': 'mean'
}).reset_index()

segment_summary.columns = ['ShopID', 'SegmentName', 'customerCount', 'averageSpend', 'averageFrequency', 'averageRecency']

# Store in MySQL
cursor.execute("TRUNCATE TABLE Customer_Segments;")
for _, row in segment_summary.iterrows():
    cursor.execute("""
        INSERT INTO Customer_Segments (ShopID, SegmentName, customerCount, averageSpend, averageFrequency, averageRecency)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, tuple(row))

conn.commit()
print("✅ Customer Segments updated successfully.")

# ========================
# 4️⃣ POPULAR SERVICES
# ========================
print("📈 Calculating popular services...")

popular_services = df.groupby(['ShopID', 'SvcName']).agg({
    'OrderID': 'count'
}).reset_index().sort_values(['ShopID', 'OrderID'], ascending=[True, False])

cursor.execute("TRUNCATE TABLE Shop_Popular_Services;")
for _, row in popular_services.iterrows():
    cursor.execute("""
        INSERT INTO Shop_Popular_Services (ShopID, SvcName, orderCount)
        VALUES (%s, %s, %s)
    """, (row['ShopID'], row['SvcName'], int(row['OrderID'])))

conn.commit()
print("✅ Popular Services updated successfully.")

# ========================
# 5️⃣ BUSIEST TIMES
# ========================
print("⏰ Calculating busiest times...")

def categorize_time(order_time):
    hour = order_time.hour
    if 7 <= hour < 12:
        return "Morning (7am-12pm)"
    elif 12 <= hour < 17:
        return "Afternoon (12pm-5pm)"
    else:
        return "Evening (5pm onwards)"

df['timeSlot'] = df['OrderCreatedAt'].apply(categorize_time)
busiest_times = df.groupby(['ShopID', 'timeSlot']).size().reset_index(name='orderCount')

cursor.execute("TRUNCATE TABLE Shop_Busiest_Times;")
for _, row in busiest_times.iterrows():
    cursor.execute("""
        INSERT INTO Shop_Busiest_Times (ShopID, timeSlot, orderCount)
        VALUES (%s, %s, %s)
    """, (row['ShopID'], row['timeSlot'], int(row['orderCount'])))

conn.commit()
print("✅ Busiest Times updated successfully.")

# ========================
# ✅ FINISH
# ========================
cursor.close()
conn.close()
print("\n🎯 Data analytics processing complete! All metrics are live in MySQL.")


# In[ ]:
