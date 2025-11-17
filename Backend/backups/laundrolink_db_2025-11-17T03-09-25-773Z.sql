-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: localhost    Database: laundrolink_db
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `add_ons`
--

DROP TABLE IF EXISTS `add_ons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `add_ons` (
  `AddOnID` varchar(10) NOT NULL,
  `ShopID` varchar(10) DEFAULT NULL,
  `AddOnName` varchar(50) NOT NULL,
  `AddOnPrice` decimal(10,2) NOT NULL,
  PRIMARY KEY (`AddOnID`),
  KEY `fk_addon_shop` (`ShopID`),
  CONSTRAINT `fk_addon_shop` FOREIGN KEY (`ShopID`) REFERENCES `laundry_shops` (`ShopID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `add_ons`
--

LOCK TABLES `add_ons` WRITE;
/*!40000 ALTER TABLE `add_ons` DISABLE KEYS */;
INSERT INTO `add_ons` VALUES ('AO01','SH01','Powder Detergent',10.00),('AO02','SH01','Liquid Detergent',10.00),('AO03','SH01','Stain Remover/Stain treatment',25.00),('AO04','SH01','Fabric Conditioner/Softener',10.00),('AO05','SH01','Dryer sheet',10.00),('AO06','SH02','Powder Detergent',10.00),('AO07','SH02','Liquid Detergent',10.00),('AO08','SH02','Stain Remover/Stain treatment',25.00),('AO09','SH02','Fabric Conditioner/Softener',10.00),('AO10','SH02','Dryer sheet',10.00);
/*!40000 ALTER TABLE `add_ons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_growth_metrics`
--

DROP TABLE IF EXISTS `admin_growth_metrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_growth_metrics` (
  `MetricID` int(11) NOT NULL,
  `totalOwners` int(11) NOT NULL DEFAULT 0,
  `activeShops` int(11) NOT NULL DEFAULT 0,
  `totalPaymentsProcessed` int(11) NOT NULL DEFAULT 0,
  `totalSystemUsers` int(11) NOT NULL DEFAULT 0,
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`MetricID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_growth_metrics`
--

LOCK TABLES `admin_growth_metrics` WRITE;
/*!40000 ALTER TABLE `admin_growth_metrics` DISABLE KEYS */;
INSERT INTO `admin_growth_metrics` VALUES (1,2,1,3,19,'2025-11-14 14:16:52');
/*!40000 ALTER TABLE `admin_growth_metrics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_monthly_growth`
--

DROP TABLE IF EXISTS `admin_monthly_growth`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_monthly_growth` (
  `MonthYear` char(7) NOT NULL,
  `NewUsers` int(11) NOT NULL DEFAULT 0,
  `NewOwners` int(11) NOT NULL DEFAULT 0,
  `AnalyzedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`MonthYear`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_monthly_growth`
--

LOCK TABLES `admin_monthly_growth` WRITE;
/*!40000 ALTER TABLE `admin_monthly_growth` DISABLE KEYS */;
INSERT INTO `admin_monthly_growth` VALUES ('2025-09',7,2,'2025-11-14 14:16:52');
/*!40000 ALTER TABLE `admin_monthly_growth` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversations` (
  `ConversationID` varchar(10) NOT NULL,
  `Participant1_ID` varchar(10) NOT NULL,
  `Participant2_ID` varchar(10) NOT NULL,
  `UpdatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`ConversationID`),
  UNIQUE KEY `uq_conversation_participants` (`Participant1_ID`,`Participant2_ID`),
  KEY `fk_participant2_id` (`Participant2_ID`),
  CONSTRAINT `fk_participant1_id` FOREIGN KEY (`Participant1_ID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE,
  CONSTRAINT `fk_participant2_id` FOREIGN KEY (`Participant2_ID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE,
  CONSTRAINT `chk_participant_order` CHECK (`Participant1_ID` < `Participant2_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversations`
--

LOCK TABLES `conversations` WRITE;
/*!40000 ALTER TABLE `conversations` DISABLE KEYS */;
/*!40000 ALTER TABLE `conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cust_addresses`
--

DROP TABLE IF EXISTS `cust_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cust_addresses` (
  `CustID` varchar(10) NOT NULL,
  `CustAddress` varchar(100) NOT NULL,
  PRIMARY KEY (`CustID`,`CustAddress`),
  CONSTRAINT `fk_custaddress_customer` FOREIGN KEY (`CustID`) REFERENCES `customers` (`CustID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cust_addresses`
--

LOCK TABLES `cust_addresses` WRITE;
/*!40000 ALTER TABLE `cust_addresses` DISABLE KEYS */;
INSERT INTO `cust_addresses` VALUES ('C1','Babag'),('C1','Gun-ob'),('C2','Basak'),('C2','Mandaue City'),('C3','Cebu City'),('C3','Pajac'),('C4','Lapu-Lapu City'),('C4','Sudtunggan'),('C5','Banilad, Cebu City'),('C6','Mabolo, Cebu City'),('C7','Talamban, Cebu City');
/*!40000 ALTER TABLE `cust_addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cust_credentials`
--

DROP TABLE IF EXISTS `cust_credentials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cust_credentials` (
  `CustID` varchar(10) NOT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `picture` text DEFAULT NULL,
  `provider` varchar(50) DEFAULT 'google',
  `paymentMethod` varchar(255) DEFAULT NULL,
  `gcash_payment_method_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`CustID`),
  UNIQUE KEY `google_id` (`google_id`),
  CONSTRAINT `fk_custcredentials_customer` FOREIGN KEY (`CustID`) REFERENCES `customers` (`CustID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cust_credentials`
--

LOCK TABLES `cust_credentials` WRITE;
/*!40000 ALTER TABLE `cust_credentials` DISABLE KEYS */;
/*!40000 ALTER TABLE `cust_credentials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_ratings`
--

DROP TABLE IF EXISTS `customer_ratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_ratings` (
  `CustRateID` varchar(10) NOT NULL,
  `OrderID` varchar(10) NOT NULL,
  `CustRating` decimal(2,1) NOT NULL,
  `CustComment` text DEFAULT NULL,
  PRIMARY KEY (`CustRateID`),
  KEY `fk_customerrating_order` (`OrderID`),
  CONSTRAINT `fk_customerrating_order` FOREIGN KEY (`OrderID`) REFERENCES `orders` (`OrderID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_ratings`
--

LOCK TABLES `customer_ratings` WRITE;
/*!40000 ALTER TABLE `customer_ratings` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_ratings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_segments`
--

DROP TABLE IF EXISTS `customer_segments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_segments` (
  `ShopID` varchar(10) NOT NULL,
  `SegmentName` varchar(50) NOT NULL,
  `customerCount` int(11) DEFAULT NULL,
  `averageSpend` decimal(10,2) DEFAULT NULL,
  `averageFrequency` decimal(10,2) DEFAULT NULL,
  `averageRecency` decimal(10,2) DEFAULT NULL,
  `SegmentedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`ShopID`,`SegmentName`),
  CONSTRAINT `customer_segments_ibfk_1` FOREIGN KEY (`ShopID`) REFERENCES `laundry_shops` (`ShopID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_segments`
--

LOCK TABLES `customer_segments` WRITE;
/*!40000 ALTER TABLE `customer_segments` DISABLE KEYS */;
INSERT INTO `customer_segments` VALUES ('SH01','Recent Customer',1,147.50,2.00,5.00,'2025-11-14 14:16:49');
/*!40000 ALTER TABLE `customer_segments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `CustID` varchar(10) NOT NULL,
  `CustName` varchar(50) NOT NULL,
  `CustPhone` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`CustID`),
  UNIQUE KEY `CustPhone` (`CustPhone`),
  CONSTRAINT `fk_customer_user` FOREIGN KEY (`CustID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES ('C1','Mary Christmas','09123234961'),('C2','Michael Jordan','09314728436'),('C3','Kaleo Galilei','09231413541'),('C4','Sheila Utangan','09213245734'),('C5','John Doe','09171112222'),('C6','Jane Smith','09282223333'),('C7','Peter Jones','09993334444');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_options`
--

DROP TABLE IF EXISTS `delivery_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_options` (
  `DlvryID` varchar(10) NOT NULL,
  `ShopID` varchar(10) DEFAULT NULL,
  `DlvryName` varchar(30) NOT NULL,
  `DlvryDescription` varchar(255) NOT NULL,
  PRIMARY KEY (`DlvryID`),
  KEY `fk_deliveryoption_shop` (`ShopID`),
  CONSTRAINT `fk_deliveryoption_shop` FOREIGN KEY (`ShopID`) REFERENCES `laundry_shops` (`ShopID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_options`
--

LOCK TABLES `delivery_options` WRITE;
/*!40000 ALTER TABLE `delivery_options` DISABLE KEYS */;
INSERT INTO `delivery_options` VALUES ('DV01','SH01','Drop-off Only','You bring your laundry directly to the shop. No additional charge will be applied for pickup or delivery.'),('DV02','SH01','Pick-up Only','The shop will book a rider to pick up your laundry from your location. You must return to the shop to collect the clean laundry.'),('DV03','SH01','Pick-up & Delivery','The shop will book a rider for both picking up your dirty laundry and delivering the clean laundry back to your doorstep.'),('DV04','SH02','Drop-off Only','You bring your laundry directly to the shop. No additional charge will be applied for pickup or delivery.'),('DV05','SH02','Pick-up Only','The shop will book a rider to pick up your laundry from your location. You must return to the shop to collect the clean laundry.'),('DV06','SH02','Pick-up & Delivery','The shop will book a rider for both picking up your dirty laundry and delivering the clean laundry back to your doorstep.');
/*!40000 ALTER TABLE `delivery_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fabric_types`
--

DROP TABLE IF EXISTS `fabric_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fabric_types` (
  `FabTypeID` varchar(10) NOT NULL,
  `ShopID` varchar(10) DEFAULT NULL,
  `FabricType` varchar(50) NOT NULL,
  PRIMARY KEY (`FabTypeID`),
  KEY `fk_fabrictype_shop` (`ShopID`),
  CONSTRAINT `fk_fabrictype_shop` FOREIGN KEY (`ShopID`) REFERENCES `laundry_shops` (`ShopID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fabric_types`
--

LOCK TABLES `fabric_types` WRITE;
/*!40000 ALTER TABLE `fabric_types` DISABLE KEYS */;
INSERT INTO `fabric_types` VALUES ('FT01','SH01','Regular Clothes'),('FT02','SH01','Blankets, bedsheets, towels, pillowcase'),('FT03','SH01','Comforter'),('FT04','SH02','Regular Clothes'),('FT05','SH02','Blankets, bedsheets, towels, pillowcase'),('FT06','SH02','Comforter');
/*!40000 ALTER TABLE `fabric_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_status`
--

DROP TABLE IF EXISTS `invoice_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_status` (
  `InvoiceStatusID` varchar(10) NOT NULL,
  `InvoiceID` varchar(10) NOT NULL,
  `InvoiceStatus` varchar(20) DEFAULT 'Pending',
  `PaidAt` datetime DEFAULT NULL,
  `StatUpdateAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `TransactionRef` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`InvoiceStatusID`),
  KEY `fk_invoicestatus_invoice` (`InvoiceID`),
  CONSTRAINT `fk_invoicestatus_invoice` FOREIGN KEY (`InvoiceID`) REFERENCES `invoices` (`InvoiceID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_status`
--

LOCK TABLES `invoice_status` WRITE;
/*!40000 ALTER TABLE `invoice_status` DISABLE KEYS */;
INSERT INTO `invoice_status` VALUES ('IS_A','INV_A','Paid','2025-11-13 22:15:18','2025-11-14 14:15:18',NULL),('IS_C1','INV_C','Draft','2025-11-13 22:15:18','2025-11-14 14:15:18',NULL),('IS_H1','INV_H1','Paid','2025-11-05 22:15:18','2025-11-14 14:15:18',NULL),('IS_H2','INV_H2','Paid','2025-11-10 22:15:18','2025-11-14 14:15:18',NULL);
/*!40000 ALTER TABLE `invoice_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `InvoiceID` varchar(10) NOT NULL,
  `OrderID` varchar(10) NOT NULL,
  `MethodID` varchar(10) DEFAULT NULL,
  `DlvryFee` decimal(10,2) DEFAULT NULL,
  `PayAmount` decimal(10,2) NOT NULL,
  `PmtCreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`InvoiceID`),
  KEY `fk_invoice_order` (`OrderID`),
  KEY `fk_invoice_method` (`MethodID`),
  CONSTRAINT `fk_invoice_method` FOREIGN KEY (`MethodID`) REFERENCES `payment_methods` (`MethodID`) ON DELETE SET NULL,
  CONSTRAINT `fk_invoice_order` FOREIGN KEY (`OrderID`) REFERENCES `orders` (`OrderID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES ('INV_A','O_ACTIVE','M01',0.00,60.00,'2025-11-14 14:15:18'),('INV_C','O_CANCEL',NULL,0.00,50.00,'2025-11-14 14:15:18'),('INV_H1','O_HIST1','M02',0.00,200.00,'2025-11-14 14:15:18'),('INV_H2','O_HIST2','M01',0.00,95.00,'2025-11-14 14:15:18');
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `laundry_details`
--

DROP TABLE IF EXISTS `laundry_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `laundry_details` (
  `LndryDtlID` varchar(10) NOT NULL,
  `Kilogram` decimal(5,2) DEFAULT NULL,
  `SpecialInstr` varchar(300) DEFAULT NULL,
  PRIMARY KEY (`LndryDtlID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `laundry_details`
--

LOCK TABLES `laundry_details` WRITE;
/*!40000 ALTER TABLE `laundry_details` DISABLE KEYS */;
INSERT INTO `laundry_details` VALUES ('LD_A',5.50,'Use sensitive detergent.'),('LD_C',6.00,'Need immediate pickup.'),('LD_H1',3.00,'Press uniforms carefully.'),('LD_H2',7.00,'Heavy starch needed.');
/*!40000 ALTER TABLE `laundry_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `laundry_shops`
--

DROP TABLE IF EXISTS `laundry_shops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `laundry_shops` (
  `ShopID` varchar(10) NOT NULL,
  `OwnerID` varchar(10) DEFAULT NULL,
  `ShopName` varchar(100) NOT NULL,
  `ShopDescrp` varchar(300) DEFAULT NULL,
  `ShopAddress` varchar(100) DEFAULT NULL,
  `ShopPhone` varchar(15) DEFAULT NULL,
  `ShopOpeningHours` varchar(50) DEFAULT NULL,
  `ShopStatus` varchar(20) DEFAULT NULL,
  `ShopImage_url` text DEFAULT NULL,
  PRIMARY KEY (`ShopID`),
  KEY `fk_laundryshop_owner` (`OwnerID`),
  CONSTRAINT `fk_laundryshop_owner` FOREIGN KEY (`OwnerID`) REFERENCES `shop_owners` (`OwnerID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `laundry_shops`
--

LOCK TABLES `laundry_shops` WRITE;
/*!40000 ALTER TABLE `laundry_shops` DISABLE KEYS */;
INSERT INTO `laundry_shops` VALUES ('SH01','O1','Wash n’ Dry - Lahug','Experience top-notch laundry facilities equipped with state-of-the-art machines and a clean, comfortable environment.','Wilson St., Lahug, Cebu City','09223324839','8:00am - 6:00pm','Available',NULL),('SH02','O2','Sparklean - Apas','Offering comprehensive laundry services with a focus on quality and customer satisfaction.','Apas, Cebu City','09171234567','9:00am - 7:00pm','Available',NULL),('SH03','O1','Laundry Cleaning - Cebu','Your go-to laundry service for fast, reliable, and affordable cleaning solutions.','Cebu City','09339876543','8:00am - 8:00pm','Available',NULL),('SH04','O2','Wash n’ Wait - Lahug','Convenient and quick laundry services designed to fit your busy lifestyle.','Wilson St., Lahug, Cebu City','09451237890','7:00am - 5:00pm','Available',NULL);
/*!40000 ALTER TABLE `laundry_shops` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `MessageID` varchar(10) NOT NULL,
  `ConversationID` varchar(10) NOT NULL,
  `SenderID` varchar(10) NOT NULL,
  `ReceiverID` varchar(10) NOT NULL,
  `MessageText` text DEFAULT NULL,
  `MessageImage` varchar(255) DEFAULT NULL,
  `MessageStatus` varchar(20) DEFAULT 'Sent',
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`MessageID`),
  KEY `fk_message_conversation` (`ConversationID`),
  KEY `fk_message_sender` (`SenderID`),
  KEY `fk_message_receiver` (`ReceiverID`),
  CONSTRAINT `fk_message_conversation` FOREIGN KEY (`ConversationID`) REFERENCES `conversations` (`ConversationID`) ON DELETE CASCADE,
  CONSTRAINT `fk_message_receiver` FOREIGN KEY (`ReceiverID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE,
  CONSTRAINT `fk_message_sender` FOREIGN KEY (`SenderID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `NotificationID` varchar(10) NOT NULL,
  `UserID` varchar(10) NOT NULL,
  `NotifType` varchar(50) NOT NULL,
  `NotifMessage` text NOT NULL,
  `NotifIsRead` tinyint(1) DEFAULT 0,
  `NotifCreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`NotificationID`),
  KEY `fk_notification_user` (`UserID`),
  CONSTRAINT `fk_notification_user` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_addons`
--

DROP TABLE IF EXISTS `order_addons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_addons` (
  `LndryDtlID` varchar(10) NOT NULL,
  `AddOnID` varchar(10) NOT NULL,
  PRIMARY KEY (`LndryDtlID`,`AddOnID`),
  KEY `fk_orderaddons_addon` (`AddOnID`),
  CONSTRAINT `fk_orderaddons_addon` FOREIGN KEY (`AddOnID`) REFERENCES `add_ons` (`AddOnID`) ON DELETE CASCADE,
  CONSTRAINT `fk_orderaddons_laundrydetails` FOREIGN KEY (`LndryDtlID`) REFERENCES `laundry_details` (`LndryDtlID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_addons`
--

LOCK TABLES `order_addons` WRITE;
/*!40000 ALTER TABLE `order_addons` DISABLE KEYS */;
INSERT INTO `order_addons` VALUES ('LD_A','AO04'),('LD_H2','AO03');
/*!40000 ALTER TABLE `order_addons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_fabrics`
--

DROP TABLE IF EXISTS `order_fabrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_fabrics` (
  `LndryDtlID` varchar(10) NOT NULL,
  `FabTypeID` varchar(10) NOT NULL,
  PRIMARY KEY (`LndryDtlID`,`FabTypeID`),
  KEY `fk_orderfabric_fabrictype` (`FabTypeID`),
  CONSTRAINT `fk_orderfabric_fabrictype` FOREIGN KEY (`FabTypeID`) REFERENCES `fabric_types` (`FabTypeID`) ON DELETE CASCADE,
  CONSTRAINT `fk_orderfabric_laundrydetails` FOREIGN KEY (`LndryDtlID`) REFERENCES `laundry_details` (`LndryDtlID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_fabrics`
--

LOCK TABLES `order_fabrics` WRITE;
/*!40000 ALTER TABLE `order_fabrics` DISABLE KEYS */;
INSERT INTO `order_fabrics` VALUES ('LD_A','FT01'),('LD_C','FT01'),('LD_H1','FT01'),('LD_H2','FT02');
/*!40000 ALTER TABLE `order_fabrics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_processing`
--

DROP TABLE IF EXISTS `order_processing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_processing` (
  `OrderProcID` varchar(10) NOT NULL,
  `OrderID` varchar(10) NOT NULL,
  `OrderProcStatus` varchar(30) NOT NULL,
  `OrderProcUpdatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`OrderProcID`),
  KEY `fk_orderprocessing_order` (`OrderID`),
  CONSTRAINT `fk_orderprocessing_order` FOREIGN KEY (`OrderID`) REFERENCES `orders` (`OrderID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_processing`
--

LOCK TABLES `order_processing` WRITE;
/*!40000 ALTER TABLE `order_processing` DISABLE KEYS */;
INSERT INTO `order_processing` VALUES ('OP_A_DRY','O_ACTIVE','Drying','2025-11-13 17:15:18'),('OP_A_WASH','O_ACTIVE','Washing','2025-11-13 15:15:18');
/*!40000 ALTER TABLE `order_processing` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_status`
--

DROP TABLE IF EXISTS `order_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_status` (
  `OrderStatID` varchar(10) NOT NULL,
  `OrderID` varchar(10) NOT NULL,
  `OrderStatus` varchar(20) NOT NULL,
  `OrderUpdatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`OrderStatID`),
  KEY `fk_orderstatus_order` (`OrderID`),
  CONSTRAINT `fk_orderstatus_order` FOREIGN KEY (`OrderID`) REFERENCES `orders` (`OrderID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_status`
--

LOCK TABLES `order_status` WRITE;
/*!40000 ALTER TABLE `order_status` DISABLE KEYS */;
INSERT INTO `order_status` VALUES ('OSD_A1','O_ACTIVE','Pending','2025-11-12 14:15:18'),('OSD_A2','O_ACTIVE','Processing','2025-11-13 14:15:18'),('OSD_C1','O_CANCEL','Pending','2025-11-13 14:15:18'),('OSD_C2','O_CANCEL','Cancelled','2025-11-14 13:15:18'),('OSD_H1A','O_HIST1','Pending','2025-11-04 14:15:18'),('OSD_H1B','O_HIST1','Processing','2025-11-05 14:15:18'),('OSD_H1C','O_HIST1','Completed','2025-11-06 14:15:18'),('OSD_H2A','O_HIST2','Pending','2025-11-09 14:15:18'),('OSD_H2B','O_HIST2','Processing','2025-11-10 14:15:18'),('OSD_H2C','O_HIST2','For Delivery','2025-11-11 14:15:18'),('OSD_H2D','O_HIST2','Completed','2025-11-12 14:15:18');
/*!40000 ALTER TABLE `order_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `OrderID` varchar(10) NOT NULL,
  `CustID` varchar(10) DEFAULT NULL,
  `StaffID` varchar(10) DEFAULT NULL,
  `ShopID` varchar(10) DEFAULT NULL,
  `SvcID` varchar(10) DEFAULT NULL,
  `LndryDtlID` varchar(10) DEFAULT NULL,
  `DlvryID` varchar(10) DEFAULT NULL,
  `OrderCreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`OrderID`),
  UNIQUE KEY `LndryDtlID` (`LndryDtlID`),
  KEY `fk_order_customer` (`CustID`),
  KEY `fk_order_staff` (`StaffID`),
  KEY `fk_order_shop` (`ShopID`),
  KEY `fk_order_delivery` (`DlvryID`),
  KEY `fk_order_service` (`SvcID`),
  CONSTRAINT `fk_order_customer` FOREIGN KEY (`CustID`) REFERENCES `customers` (`CustID`) ON DELETE SET NULL,
  CONSTRAINT `fk_order_delivery` FOREIGN KEY (`DlvryID`) REFERENCES `delivery_options` (`DlvryID`) ON DELETE SET NULL,
  CONSTRAINT `fk_order_laundrydetails` FOREIGN KEY (`LndryDtlID`) REFERENCES `laundry_details` (`LndryDtlID`) ON DELETE SET NULL,
  CONSTRAINT `fk_order_service` FOREIGN KEY (`SvcID`) REFERENCES `services` (`SvcID`) ON DELETE SET NULL,
  CONSTRAINT `fk_order_shop` FOREIGN KEY (`ShopID`) REFERENCES `laundry_shops` (`ShopID`) ON DELETE SET NULL,
  CONSTRAINT `fk_order_staff` FOREIGN KEY (`StaffID`) REFERENCES `staffs` (`StaffID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES ('O_ACTIVE','C1','S4','SH01','SV01','LD_A','DV03','2025-11-12 14:15:18'),('O_CANCEL','C1','S4','SH01','SV04','LD_C','DV02','2025-11-13 14:15:18'),('O_HIST1','C1','S4','SH01','SV05','LD_H1','DV01','2025-11-04 14:15:18'),('O_HIST2','C1','S4','SH01','SV02','LD_H2','DV03','2025-11-09 14:15:18');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otps`
--

DROP TABLE IF EXISTS `otps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otps` (
  `otp_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(10) NOT NULL,
  `otp_code` varchar(6) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`otp_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `otps_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otps`
--

LOCK TABLES `otps` WRITE;
/*!40000 ALTER TABLE `otps` DISABLE KEYS */;
INSERT INTO `otps` VALUES (2,'C1','927863','2025-11-15 21:05:33','2025-11-15 12:55:33');
/*!40000 ALTER TABLE `otps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_methods`
--

DROP TABLE IF EXISTS `payment_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_methods` (
  `MethodID` varchar(10) NOT NULL,
  `MethodName` varchar(30) NOT NULL,
  PRIMARY KEY (`MethodID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_methods`
--

LOCK TABLES `payment_methods` WRITE;
/*!40000 ALTER TABLE `payment_methods` DISABLE KEYS */;
INSERT INTO `payment_methods` VALUES ('M01','Gcash'),('M02','Cash');
/*!40000 ALTER TABLE `payment_methods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rejected_orders`
--

DROP TABLE IF EXISTS `rejected_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rejected_orders` (
  `RejectedID` varchar(10) NOT NULL,
  `OrderID` varchar(10) NOT NULL,
  `RejectionReason` varchar(255) NOT NULL,
  `RejectionNote` text DEFAULT NULL,
  `RejectedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`RejectedID`),
  KEY `fk_rejectedorder_order` (`OrderID`),
  CONSTRAINT `fk_rejectedorder_order` FOREIGN KEY (`OrderID`) REFERENCES `orders` (`OrderID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rejected_orders`
--

LOCK TABLES `rejected_orders` WRITE;
/*!40000 ALTER TABLE `rejected_orders` DISABLE KEYS */;
INSERT INTO `rejected_orders` VALUES ('REJ_C','O_CANCEL','Customer Initiated Cancellation',NULL,'2025-11-14 13:15:18');
/*!40000 ALTER TABLE `rejected_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `services` (
  `SvcID` varchar(10) NOT NULL,
  `SvcName` varchar(50) NOT NULL,
  PRIMARY KEY (`SvcID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES ('SV01','Wash & Dry'),('SV02','Wash, Dry, & Press'),('SV03','Press only'),('SV04','Wash, Dry, & Fold'),('SV05','Full Service');
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shop_busiest_times`
--

DROP TABLE IF EXISTS `shop_busiest_times`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shop_busiest_times` (
  `ShopID` varchar(10) NOT NULL,
  `timeSlot` varchar(50) NOT NULL,
  `orderCount` int(11) DEFAULT NULL,
  `AnalyzedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`ShopID`,`timeSlot`),
  CONSTRAINT `shop_busiest_times_ibfk_1` FOREIGN KEY (`ShopID`) REFERENCES `laundry_shops` (`ShopID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shop_busiest_times`
--

LOCK TABLES `shop_busiest_times` WRITE;
/*!40000 ALTER TABLE `shop_busiest_times` DISABLE KEYS */;
INSERT INTO `shop_busiest_times` VALUES ('SH01','Evening (5pm onwards)',2,'2025-11-14 14:16:49');
/*!40000 ALTER TABLE `shop_busiest_times` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shop_distance`
--

DROP TABLE IF EXISTS `shop_distance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shop_distance` (
  `ShopID` varchar(10) NOT NULL,
  `ShopLatitude` decimal(10,8) NOT NULL,
  `ShopLongitude` decimal(11,8) NOT NULL,
  PRIMARY KEY (`ShopID`),
  CONSTRAINT `fk_shop_distance` FOREIGN KEY (`ShopID`) REFERENCES `laundry_shops` (`ShopID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shop_distance`
--

LOCK TABLES `shop_distance` WRITE;
/*!40000 ALTER TABLE `shop_distance` DISABLE KEYS */;
INSERT INTO `shop_distance` VALUES ('SH01',10.33083300,123.90638900),('SH02',10.32000000,123.90000000),('SH03',10.31500000,123.89500000),('SH04',10.33150000,123.90700000);
/*!40000 ALTER TABLE `shop_distance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shop_owners`
--

DROP TABLE IF EXISTS `shop_owners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shop_owners` (
  `OwnerID` varchar(10) NOT NULL,
  `OwnerName` varchar(100) NOT NULL,
  `OwnerPhone` varchar(15) DEFAULT NULL,
  `OwnerAddress` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`OwnerID`),
  CONSTRAINT `fk_shopowner_user` FOREIGN KEY (`OwnerID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shop_owners`
--

LOCK TABLES `shop_owners` WRITE;
/*!40000 ALTER TABLE `shop_owners` DISABLE KEYS */;
INSERT INTO `shop_owners` VALUES ('O1','Elon Musk','09313314135','Lapu-Lapu City'),('O2','Mark Zuckerberg','09313762534','Mandaue City');
/*!40000 ALTER TABLE `shop_owners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shop_popular_services`
--

DROP TABLE IF EXISTS `shop_popular_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shop_popular_services` (
  `ShopID` varchar(10) NOT NULL,
  `SvcName` varchar(50) NOT NULL,
  `orderCount` int(11) DEFAULT NULL,
  `AnalyzedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`ShopID`,`SvcName`),
  CONSTRAINT `shop_popular_services_ibfk_1` FOREIGN KEY (`ShopID`) REFERENCES `laundry_shops` (`ShopID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shop_popular_services`
--

LOCK TABLES `shop_popular_services` WRITE;
/*!40000 ALTER TABLE `shop_popular_services` DISABLE KEYS */;
INSERT INTO `shop_popular_services` VALUES ('SH01','Full Service',1,'2025-11-14 14:16:49'),('SH01','Wash, Dry, & Press',1,'2025-11-14 14:16:49');
/*!40000 ALTER TABLE `shop_popular_services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shop_rate_stats`
--

DROP TABLE IF EXISTS `shop_rate_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shop_rate_stats` (
  `ShopStatID` varchar(10) NOT NULL,
  `ShopRevID` varchar(10) NOT NULL,
  `InitialRating` decimal(2,1) NOT NULL,
  `UpdatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`ShopStatID`),
  KEY `fk_shopratestats_shoprates` (`ShopRevID`),
  CONSTRAINT `fk_shopratestats_shoprates` FOREIGN KEY (`ShopRevID`) REFERENCES `shop_rates` (`ShopRevID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shop_rate_stats`
--

LOCK TABLES `shop_rate_stats` WRITE;
/*!40000 ALTER TABLE `shop_rate_stats` DISABLE KEYS */;
/*!40000 ALTER TABLE `shop_rate_stats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shop_rates`
--

DROP TABLE IF EXISTS `shop_rates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shop_rates` (
  `ShopRevID` varchar(10) NOT NULL,
  `ShopID` varchar(10) NOT NULL,
  `ShopRating` decimal(2,1) NOT NULL,
  PRIMARY KEY (`ShopRevID`),
  KEY `fk_shoprates_shop` (`ShopID`),
  CONSTRAINT `fk_shoprates_shop` FOREIGN KEY (`ShopID`) REFERENCES `laundry_shops` (`ShopID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shop_rates`
--

LOCK TABLES `shop_rates` WRITE;
/*!40000 ALTER TABLE `shop_rates` DISABLE KEYS */;
/*!40000 ALTER TABLE `shop_rates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shop_services`
--

DROP TABLE IF EXISTS `shop_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shop_services` (
  `ShopID` varchar(10) NOT NULL,
  `SvcID` varchar(10) NOT NULL,
  `SvcPrice` decimal(10,2) NOT NULL,
  `MinLoad` int(11) DEFAULT NULL,
  `MaxLoad` int(11) DEFAULT NULL,
  PRIMARY KEY (`ShopID`,`SvcID`),
  KEY `fk_shopservice_service` (`SvcID`),
  CONSTRAINT `fk_shopservice_service` FOREIGN KEY (`SvcID`) REFERENCES `services` (`SvcID`) ON DELETE CASCADE,
  CONSTRAINT `fk_shopservice_shop` FOREIGN KEY (`ShopID`) REFERENCES `laundry_shops` (`ShopID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shop_services`
--

LOCK TABLES `shop_services` WRITE;
/*!40000 ALTER TABLE `shop_services` DISABLE KEYS */;
INSERT INTO `shop_services` VALUES ('SH01','SV01',50.00,5,8),('SH01','SV02',70.00,5,8),('SH01','SV03',80.00,5,8),('SH01','SV04',50.00,4,7),('SH01','SV05',200.00,0,4),('SH02','SV01',100.00,3,6),('SH02','SV04',80.00,5,8),('SH02','SV05',75.00,6,9);
/*!40000 ALTER TABLE `shop_services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_infos`
--

DROP TABLE IF EXISTS `staff_infos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_infos` (
  `StaffInfoID` varchar(10) NOT NULL,
  `StaffID` varchar(10) NOT NULL,
  `StaffAge` int(11) DEFAULT NULL,
  `StaffAddress` varchar(100) DEFAULT NULL,
  `StaffCellNo` varchar(15) DEFAULT NULL,
  `StaffSalary` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`StaffInfoID`),
  KEY `fk_staff_info` (`StaffID`),
  CONSTRAINT `fk_staff_info` FOREIGN KEY (`StaffID`) REFERENCES `staffs` (`StaffID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_infos`
--

LOCK TABLES `staff_infos` WRITE;
/*!40000 ALTER TABLE `staff_infos` DISABLE KEYS */;
INSERT INTO `staff_infos` VALUES ('SI01','S1',34,'Babag','09313824424',23500.00),('SI02','S2',41,'Cebu City','09371844244',23500.00),('SI03','S3',28,'Marigondon, Lapu-Lapu City','09215556677',24000.00),('SI04','S4',22,'Pusok, Lapu-Lapu City','09337778899',22500.00),('SI05','S5',35,'Tipolo, Mandaue City','09451112233',25000.00),('SI06','S6',29,'Subangdaku, Mandaue City','09173334455',23000.00);
/*!40000 ALTER TABLE `staff_infos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staffs`
--

DROP TABLE IF EXISTS `staffs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staffs` (
  `StaffID` varchar(10) NOT NULL,
  `StaffName` varchar(10) NOT NULL,
  `StaffRole` varchar(20) DEFAULT NULL,
  `ShopID` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`StaffID`),
  KEY `fk_staff_shop` (`ShopID`),
  CONSTRAINT `fk_staff_shop` FOREIGN KEY (`ShopID`) REFERENCES `laundry_shops` (`ShopID`) ON DELETE SET NULL,
  CONSTRAINT `fk_staff_user` FOREIGN KEY (`StaffID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staffs`
--

LOCK TABLES `staffs` WRITE;
/*!40000 ALTER TABLE `staffs` DISABLE KEYS */;
INSERT INTO `staffs` VALUES ('S1','Marites Ab','Laundress','SH01'),('S2','Karen Odon','Cashier','SH02'),('S3','John Doe','Laundress','SH01'),('S4','Emily Whit','Cashier','SH01'),('S5','Michael Br','Laundress','SH02'),('S6','Jessica Gr','Presser','SH02');
/*!40000 ALTER TABLE `staffs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `systemconfig`
--

DROP TABLE IF EXISTS `systemconfig`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `systemconfig` (
  `ConfigKey` varchar(50) NOT NULL,
  `ConfigValue` varchar(255) NOT NULL,
  PRIMARY KEY (`ConfigKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `systemconfig`
--

LOCK TABLES `systemconfig` WRITE;
/*!40000 ALTER TABLE `systemconfig` DISABLE KEYS */;
INSERT INTO `systemconfig` VALUES ('MAINTENANCE_MODE','false');
/*!40000 ALTER TABLE `systemconfig` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_logs`
--

DROP TABLE IF EXISTS `user_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_logs` (
  `UserLogID` int(11) NOT NULL AUTO_INCREMENT,
  `UserID` varchar(10) NOT NULL,
  `UserRole` varchar(50) DEFAULT NULL,
  `UsrLogAction` varchar(100) NOT NULL,
  `UsrLogDescrpt` varchar(255) DEFAULT NULL,
  `UsrLogTmstp` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`UserLogID`),
  KEY `fk_userlogs_user` (`UserID`),
  CONSTRAINT `fk_userlogs_user` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_logs`
--

LOCK TABLES `user_logs` WRITE;
/*!40000 ALTER TABLE `user_logs` DISABLE KEYS */;
INSERT INTO `user_logs` VALUES (1,'A1','Admin','Login','User logged in successfully','2025-11-14 14:16:32'),(2,'O1','Shop Owner','Login','User logged in successfully','2025-11-14 14:26:04'),(3,'A1','Admin','Login','User logged in successfully','2025-11-15 11:18:57'),(4,'O1','Shop Owner','Login','User logged in successfully','2025-11-15 11:27:30'),(5,'A1','Admin','Login','User logged in successfully','2025-11-15 11:29:04'),(6,'O1','Shop Owner','Login','User logged in successfully','2025-11-15 11:29:17'),(7,'O1','Shop Owner','Login','User logged in successfully','2025-11-15 11:32:55'),(8,'O1','Shop Owner','Login','User logged in successfully','2025-11-15 11:37:54'),(9,'O1','Shop Owner','Login','User logged in successfully','2025-11-15 11:40:23'),(10,'O1','Shop Owner','Login','User logged in successfully','2025-11-15 11:51:37'),(11,'O2','Shop Owner','Login','User logged in successfully','2025-11-15 11:55:53'),(12,'O1','Shop Owner','Login','User logged in successfully','2025-11-15 12:00:47'),(13,'O1','Shop Owner','Login','User logged in successfully','2025-11-15 12:04:13'),(14,'O1','Shop Owner','Login','User logged in successfully','2025-11-15 12:08:03'),(15,'A1','Admin','Login','User logged in successfully','2025-11-15 12:08:21'),(16,'O1','Shop Owner','Login','User logged in successfully','2025-11-15 12:15:40'),(17,'O1','Shop Owner','Login','User logged in successfully','2025-11-15 12:18:15'),(18,'O1','Shop Owner','Login','User logged in successfully','2025-11-15 12:18:41'),(19,'O1','Shop Owner','Login','User logged in successfully','2025-11-15 12:19:06'),(20,'C1','Customer','Login','Customer logged in successfully (OTP verified)','2025-11-15 12:54:54'),(21,'A1','Admin','Login','User logged in successfully','2025-11-15 12:57:02'),(22,'S2','Staff','Login','User logged in successfully','2025-11-15 13:08:33'),(23,'A1','Admin','Login','User logged in successfully','2025-11-15 13:36:25'),(24,'A1','Admin','Login','User logged in successfully','2025-11-15 14:52:38'),(25,'A1','Admin','Login','User logged in successfully','2025-11-17 02:55:58');
/*!40000 ALTER TABLE `user_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `UserID` varchar(10) NOT NULL,
  `UserEmail` varchar(100) NOT NULL,
  `UserPassword` varchar(100) DEFAULT NULL,
  `UserRole` varchar(20) NOT NULL,
  `DateCreated` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `UserEmail` (`UserEmail`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('A1','mj1','mj123','Admin','2025-09-15 02:00:01'),('A2','juriel2','juriel2','Admin','2025-09-15 02:00:02'),('A3','kezhea3','kezhea3','Admin','2025-09-15 02:00:03'),('A4','jasper4','jasper4','Admin','2025-09-15 02:00:04'),('C1','mary','mary','Customer','2025-09-15 02:00:05'),('C2','jordan','jordan','Customer','2025-09-15 02:00:06'),('C3','kaleo@gmail.com','kaleo','Customer','2025-09-15 02:00:07'),('C4','sheila@gmail.com','sheila','Customer','2025-09-15 02:00:08'),('C5','john.doe@email.com','john','Customer','2025-09-15 02:00:17'),('C6','jane.smith@email.com','jane','Customer','2025-09-15 02:00:18'),('C7','laundrolink.mobile@gmail.com','laundrolink','Customer','2025-09-15 02:00:19'),('O1','elon.musk@gmail.com','elon','Shop Owner','2025-09-15 02:00:15'),('O2','mark.zuckerberg@gmail.com','mark','Shop Owner','2025-09-15 02:00:16'),('S1','marites1','marites1','Staff','2025-09-15 02:00:09'),('S2','karen2','karen2','Staff','2025-09-15 02:00:10'),('S3','john3','john3','Staff','2025-09-15 02:00:11'),('S4','emily4','emily4','Staff','2025-09-15 02:00:12'),('S5','michael5','michael5','Staff','2025-09-15 02:00:13'),('S6','jessica6','jessica6','Staff','2025-09-15 02:00:14');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-17 11:09:38
