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
  `AddOnID` int(11) NOT NULL AUTO_INCREMENT,
  `AddOnName` varchar(50) NOT NULL,
  PRIMARY KEY (`AddOnID`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `add_ons`
--

LOCK TABLES `add_ons` WRITE;
/*!40000 ALTER TABLE `add_ons` DISABLE KEYS */;
INSERT INTO `add_ons` VALUES (1,'Powder Detergent'),(2,'Liquid Detergent'),(3,'Stain Remover/Stain treatment'),(4,'Fabric Conditioner/Softener'),(5,'Dryer sheet');
/*!40000 ALTER TABLE `add_ons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversations` (
  `ConversationID` int(11) NOT NULL AUTO_INCREMENT,
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
  `CustRateID` int(11) NOT NULL AUTO_INCREMENT,
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
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `CustID` varchar(10) NOT NULL,
  `CustName` varchar(50) NOT NULL,
  `CustPhone` varchar(20) DEFAULT NULL,
  `CustAddress` varchar(100) DEFAULT NULL,
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
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_app`
--

DROP TABLE IF EXISTS `delivery_app`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_app` (
  `DlvryAppID` int(11) NOT NULL AUTO_INCREMENT,
  `DlvryAppName` varchar(100) NOT NULL,
  `AppBaseFare` decimal(10,2) NOT NULL,
  `AppBaseKm` int(11) NOT NULL,
  `AppDistanceRate` decimal(10,2) NOT NULL,
  PRIMARY KEY (`DlvryAppID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_app`
--

LOCK TABLES `delivery_app` WRITE;
/*!40000 ALTER TABLE `delivery_app` DISABLE KEYS */;
INSERT INTO `delivery_app` VALUES (1,'Lalamove',50.00,5,10.00);
/*!40000 ALTER TABLE `delivery_app` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_payments`
--

DROP TABLE IF EXISTS `delivery_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_payments` (
  `DlvryPayID` int(11) NOT NULL AUTO_INCREMENT,
  `OrderID` varchar(10) NOT NULL,
  `DlvryAmount` decimal(10,2) NOT NULL,
  `MethodID` int(11) NOT NULL,
  `PaymentProofImage` text DEFAULT NULL,
  `DlvryProofImage` text DEFAULT NULL,
  `DlvryPaymentStatus` varchar(20) DEFAULT 'To Confirm',
  `StatusUpdatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`DlvryPayID`),
  KEY `fk_dlvry_pay_order` (`OrderID`),
  KEY `fk_delivery_payment` (`MethodID`),
  CONSTRAINT `fk_delivery_payment` FOREIGN KEY (`MethodID`) REFERENCES `payment_methods` (`MethodID`) ON DELETE CASCADE,
  CONSTRAINT `fk_dlvry_pay_order` FOREIGN KEY (`OrderID`) REFERENCES `orders` (`OrderID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_payments`
--

LOCK TABLES `delivery_payments` WRITE;
/*!40000 ALTER TABLE `delivery_payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `delivery_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_status`
--

DROP TABLE IF EXISTS `delivery_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_status` (
  `DlvryStatID` int(11) NOT NULL AUTO_INCREMENT,
  `OrderID` varchar(10) NOT NULL,
  `DlvryStatus` varchar(30) NOT NULL,
  `UpdatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`DlvryStatID`),
  KEY `fk_delivery_status_order` (`OrderID`),
  CONSTRAINT `fk_delivery_status_order` FOREIGN KEY (`OrderID`) REFERENCES `orders` (`OrderID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_status`
--

LOCK TABLES `delivery_status` WRITE;
/*!40000 ALTER TABLE `delivery_status` DISABLE KEYS */;
/*!40000 ALTER TABLE `delivery_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_types`
--

DROP TABLE IF EXISTS `delivery_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_types` (
  `DlvryTypeID` int(11) NOT NULL AUTO_INCREMENT,
  `DlvryTypeName` varchar(30) NOT NULL,
  `DlvryDescription` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`DlvryTypeID`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_types`
--

LOCK TABLES `delivery_types` WRITE;
/*!40000 ALTER TABLE `delivery_types` DISABLE KEYS */;
INSERT INTO `delivery_types` VALUES (1,'Drop-off Only','You bring your laundry directly to the shop. No additional charge will be applied for pickup or delivery.'),(2,'Pick-up Only','The shop will book a rider to pick up your laundry from your location. You must return to the shop to collect the clean laundry.'),(3,'For Delivery','The shop will book a rider to deliver your laundry from your location. You must deliver the laundry to the shop.'),(4,'Pick-up & Delivery','The shop will book a rider for both picking up your dirty laundry and delivering the clean laundry back to your doorstep.');
/*!40000 ALTER TABLE `delivery_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fabrics`
--

DROP TABLE IF EXISTS `fabrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fabrics` (
  `FabID` int(11) NOT NULL AUTO_INCREMENT,
  `FabName` varchar(50) NOT NULL,
  PRIMARY KEY (`FabID`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fabrics`
--

LOCK TABLES `fabrics` WRITE;
/*!40000 ALTER TABLE `fabrics` DISABLE KEYS */;
INSERT INTO `fabrics` VALUES (1,'Regular Clothes'),(2,'Blankets, bedsheets, towels, pillowcase'),(3,'Comforter');
/*!40000 ALTER TABLE `fabrics` ENABLE KEYS */;
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
  `MethodID` int(11) NOT NULL,
  `PayAmount` decimal(10,2) NOT NULL,
  `ProofImage` text DEFAULT NULL,
  `PaymentStatus` varchar(20) DEFAULT 'To Confirm',
  `StatusUpdatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `PmtCreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`InvoiceID`),
  KEY `fk_invoice_order` (`OrderID`),
  KEY `fk_invoice_method` (`MethodID`),
  CONSTRAINT `fk_invoice_method` FOREIGN KEY (`MethodID`) REFERENCES `payment_methods` (`MethodID`) ON DELETE CASCADE,
  CONSTRAINT `fk_invoice_order` FOREIGN KEY (`OrderID`) REFERENCES `orders` (`OrderID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `laundry_details`
--

DROP TABLE IF EXISTS `laundry_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `laundry_details` (
  `LndryDtlID` int(11) NOT NULL AUTO_INCREMENT,
  `OrderID` varchar(10) NOT NULL,
  `SvcID` int(11) NOT NULL,
  `DlvryID` int(11) NOT NULL,
  `Kilogram` decimal(5,1) DEFAULT NULL,
  `SpecialInstr` varchar(300) DEFAULT NULL,
  PRIMARY KEY (`LndryDtlID`),
  KEY `fk_laundrydetails_order` (`OrderID`),
  KEY `fk_order_service` (`SvcID`),
  KEY `fk_order_delivery` (`DlvryID`),
  CONSTRAINT `fk_laundrydetails_order` FOREIGN KEY (`OrderID`) REFERENCES `orders` (`OrderID`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_delivery` FOREIGN KEY (`DlvryID`) REFERENCES `shop_delivery_options` (`DlvryID`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_service` FOREIGN KEY (`SvcID`) REFERENCES `services` (`SvcID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `laundry_details`
--

LOCK TABLES `laundry_details` WRITE;
/*!40000 ALTER TABLE `laundry_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `laundry_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `laundry_shops`
--

DROP TABLE IF EXISTS `laundry_shops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `laundry_shops` (
  `ShopID` int(11) NOT NULL AUTO_INCREMENT,
  `OwnerID` varchar(10) DEFAULT NULL,
  `ShopName` varchar(100) NOT NULL,
  `ShopDescrp` varchar(300) DEFAULT NULL,
  `ShopAddress` varchar(100) DEFAULT NULL,
  `ShopPhone` varchar(15) DEFAULT NULL,
  `ShopOpeningHours` varchar(50) DEFAULT NULL,
  `ShopStatus` varchar(20) DEFAULT NULL,
  `DateCreated` timestamp NOT NULL DEFAULT current_timestamp(),
  `ShopImage_url` text DEFAULT NULL,
  PRIMARY KEY (`ShopID`),
  KEY `fk_laundryshop_owner` (`OwnerID`),
  CONSTRAINT `fk_laundryshop_owner` FOREIGN KEY (`OwnerID`) REFERENCES `shop_owners` (`OwnerID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `laundry_shops`
--

LOCK TABLES `laundry_shops` WRITE;
/*!40000 ALTER TABLE `laundry_shops` DISABLE KEYS */;
INSERT INTO `laundry_shops` VALUES (1,'O1','Wash N\' Dry','Experience top-notch laundry facilities equipped with state-of-the-art machines and a clean, comfortable environment.','La Aldea Buena Mactan, Basak, Lapu-Lapu, Central Visayas, Philippines','09171234567','8:00am - 6:00pm','Available','2025-11-22 16:33:27',NULL);
/*!40000 ALTER TABLE `laundry_shops` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `MessageID` int(11) NOT NULL AUTO_INCREMENT,
  `ConversationID` int(11) NOT NULL,
  `SenderID` varchar(10) NOT NULL,
  `ReceiverID` varchar(10) NOT NULL,
  `MessageText` text DEFAULT NULL,
  `MessageImage` text DEFAULT NULL,
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
  `NotificationID` int(11) NOT NULL AUTO_INCREMENT,
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
  `LndryDtlID` int(11) NOT NULL,
  `AddOnID` int(11) NOT NULL,
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
/*!40000 ALTER TABLE `order_addons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_fabrics`
--

DROP TABLE IF EXISTS `order_fabrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_fabrics` (
  `LndryDtlID` int(11) NOT NULL,
  `FabID` int(11) NOT NULL,
  PRIMARY KEY (`LndryDtlID`,`FabID`),
  KEY `fk_orderfabric_fabrictype` (`FabID`),
  CONSTRAINT `fk_orderfabric_fabrictype` FOREIGN KEY (`FabID`) REFERENCES `fabrics` (`FabID`) ON DELETE CASCADE,
  CONSTRAINT `fk_orderfabric_laundrydetails` FOREIGN KEY (`LndryDtlID`) REFERENCES `laundry_details` (`LndryDtlID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_fabrics`
--

LOCK TABLES `order_fabrics` WRITE;
/*!40000 ALTER TABLE `order_fabrics` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_fabrics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_processing`
--

DROP TABLE IF EXISTS `order_processing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_processing` (
  `OrderProcID` int(11) NOT NULL AUTO_INCREMENT,
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
/*!40000 ALTER TABLE `order_processing` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_status`
--

DROP TABLE IF EXISTS `order_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_status` (
  `OrderStatID` int(11) NOT NULL AUTO_INCREMENT,
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
  `ShopID` int(11) NOT NULL,
  `OrderCreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`OrderID`),
  KEY `fk_order_customer` (`CustID`),
  KEY `fk_order_staff` (`StaffID`),
  KEY `fk_order_shop` (`ShopID`),
  CONSTRAINT `fk_order_customer` FOREIGN KEY (`CustID`) REFERENCES `customers` (`CustID`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_shop` FOREIGN KEY (`ShopID`) REFERENCES `laundry_shops` (`ShopID`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_staff` FOREIGN KEY (`StaffID`) REFERENCES `staffs` (`StaffID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otps`
--

LOCK TABLES `otps` WRITE;
/*!40000 ALTER TABLE `otps` DISABLE KEYS */;
/*!40000 ALTER TABLE `otps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_methods`
--

DROP TABLE IF EXISTS `payment_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_methods` (
  `MethodID` int(11) NOT NULL AUTO_INCREMENT,
  `MethodName` varchar(30) NOT NULL,
  PRIMARY KEY (`MethodID`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_methods`
--

LOCK TABLES `payment_methods` WRITE;
/*!40000 ALTER TABLE `payment_methods` DISABLE KEYS */;
INSERT INTO `payment_methods` VALUES (1,'Cash'),(2,'Paypal');
/*!40000 ALTER TABLE `payment_methods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rejected_orders`
--

DROP TABLE IF EXISTS `rejected_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rejected_orders` (
  `RejectedID` int(11) NOT NULL AUTO_INCREMENT,
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
/*!40000 ALTER TABLE `rejected_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `services` (
  `SvcID` int(11) NOT NULL AUTO_INCREMENT,
  `SvcName` varchar(50) NOT NULL,
  PRIMARY KEY (`SvcID`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES (1,'Wash & Dry'),(2,'Wash, Dry, & Press'),(3,'Press only'),(4,'Wash, Dry, & Fold'),(5,'Full Service');
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shop_add_ons`
--

DROP TABLE IF EXISTS `shop_add_ons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shop_add_ons` (
  `ShopID` int(11) NOT NULL,
  `AddOnID` int(11) NOT NULL,
  `AddOnPrice` decimal(10,2) NOT NULL,
  PRIMARY KEY (`ShopID`,`AddOnID`),
  KEY `fk_shopaddon_addon` (`AddOnID`),
  CONSTRAINT `fk_shopaddon_addon` FOREIGN KEY (`AddOnID`) REFERENCES `add_ons` (`AddOnID`) ON DELETE CASCADE,
  CONSTRAINT `fk_shopaddon_shop` FOREIGN KEY (`ShopID`) REFERENCES `laundry_shops` (`ShopID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shop_add_ons`
--

LOCK TABLES `shop_add_ons` WRITE;
/*!40000 ALTER TABLE `shop_add_ons` DISABLE KEYS */;
INSERT INTO `shop_add_ons` VALUES (1,1,20.00),(1,2,25.00),(1,3,27.00),(1,5,50.00);
/*!40000 ALTER TABLE `shop_add_ons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shop_delivery_app`
--

DROP TABLE IF EXISTS `shop_delivery_app`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shop_delivery_app` (
  `ShopID` int(11) NOT NULL,
  `DlvryAppID` int(11) NOT NULL,
  PRIMARY KEY (`ShopID`,`DlvryAppID`),
  KEY `fk_sda_app` (`DlvryAppID`),
  CONSTRAINT `fk_sda_app` FOREIGN KEY (`DlvryAppID`) REFERENCES `delivery_app` (`DlvryAppID`) ON DELETE CASCADE,
  CONSTRAINT `fk_sda_shop` FOREIGN KEY (`ShopID`) REFERENCES `laundry_shops` (`ShopID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shop_delivery_app`
--

LOCK TABLES `shop_delivery_app` WRITE;
/*!40000 ALTER TABLE `shop_delivery_app` DISABLE KEYS */;
/*!40000 ALTER TABLE `shop_delivery_app` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shop_delivery_options`
--

DROP TABLE IF EXISTS `shop_delivery_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shop_delivery_options` (
  `DlvryID` int(11) NOT NULL AUTO_INCREMENT,
  `ShopID` int(11) NOT NULL,
  `DlvryTypeID` int(11) NOT NULL,
  `DlvryDescription` varchar(255) NOT NULL,
  PRIMARY KEY (`DlvryID`),
  KEY `fk_shopdelivery_shop` (`ShopID`),
  KEY `fk_shopdelivery_type` (`DlvryTypeID`),
  CONSTRAINT `fk_shopdelivery_shop` FOREIGN KEY (`ShopID`) REFERENCES `laundry_shops` (`ShopID`) ON DELETE CASCADE,
  CONSTRAINT `fk_shopdelivery_type` FOREIGN KEY (`DlvryTypeID`) REFERENCES `delivery_types` (`DlvryTypeID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shop_delivery_options`
--

LOCK TABLES `shop_delivery_options` WRITE;
/*!40000 ALTER TABLE `shop_delivery_options` DISABLE KEYS */;
INSERT INTO `shop_delivery_options` VALUES (1,1,1,'You bring your laundry directly to the shop. No additional charge will be applied for pickup or delivery.'),(2,1,2,'The shop will book a rider to pick up your laundry from your location. You must return to the shop to collect the clean laundry.'),(3,1,3,'The shop will book a rider to deliver your laundry from your location. You must deliver the laundry to the shop.'),(4,1,4,'The shop will book a rider for both picking up your dirty laundry and delivering the clean laundry back to your doorstep.');
/*!40000 ALTER TABLE `shop_delivery_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shop_distance`
--

DROP TABLE IF EXISTS `shop_distance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shop_distance` (
  `ShopID` int(11) NOT NULL,
  `ShopLatitude` decimal(10,8) NOT NULL,
  `ShopLongitude` decimal(11,8) NOT NULL,
  KEY `fk_shop_distance` (`ShopID`),
  CONSTRAINT `fk_shop_distance` FOREIGN KEY (`ShopID`) REFERENCES `laundry_shops` (`ShopID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shop_distance`
--

LOCK TABLES `shop_distance` WRITE;
/*!40000 ALTER TABLE `shop_distance` DISABLE KEYS */;
INSERT INTO `shop_distance` VALUES (1,10.28754410,123.95398230);
/*!40000 ALTER TABLE `shop_distance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shop_fabrics`
--

DROP TABLE IF EXISTS `shop_fabrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shop_fabrics` (
  `ShopID` int(11) NOT NULL,
  `FabID` int(11) NOT NULL,
  PRIMARY KEY (`ShopID`,`FabID`),
  KEY `fk_shopfabric_fabric` (`FabID`),
  CONSTRAINT `fk_shopfabric_fabric` FOREIGN KEY (`FabID`) REFERENCES `fabrics` (`FabID`) ON DELETE CASCADE,
  CONSTRAINT `fk_shopfabric_shop` FOREIGN KEY (`ShopID`) REFERENCES `laundry_shops` (`ShopID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shop_fabrics`
--

LOCK TABLES `shop_fabrics` WRITE;
/*!40000 ALTER TABLE `shop_fabrics` DISABLE KEYS */;
INSERT INTO `shop_fabrics` VALUES (1,1),(1,2),(1,3);
/*!40000 ALTER TABLE `shop_fabrics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shop_own_service`
--

DROP TABLE IF EXISTS `shop_own_service`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shop_own_service` (
  `DlvryOwnServiceID` int(11) NOT NULL AUTO_INCREMENT,
  `ShopID` int(11) NOT NULL,
  `ShopBaseFare` decimal(10,2) NOT NULL,
  `ShopBaseKm` int(11) NOT NULL,
  `ShopDistanceRate` decimal(10,2) NOT NULL,
  `ShopServiceStatus` varchar(20) DEFAULT 'Inactive',
  PRIMARY KEY (`DlvryOwnServiceID`),
  UNIQUE KEY `ShopID` (`ShopID`),
  CONSTRAINT `fk_shop_own_service` FOREIGN KEY (`ShopID`) REFERENCES `laundry_shops` (`ShopID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shop_own_service`
--

LOCK TABLES `shop_own_service` WRITE;
/*!40000 ALTER TABLE `shop_own_service` DISABLE KEYS */;
INSERT INTO `shop_own_service` VALUES (1,1,30.00,3,10.00,'Active');
/*!40000 ALTER TABLE `shop_own_service` ENABLE KEYS */;
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
INSERT INTO `shop_owners` VALUES ('O1','Test User','09324254244','Test User Address');
/*!40000 ALTER TABLE `shop_owners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shop_rate_stats`
--

DROP TABLE IF EXISTS `shop_rate_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shop_rate_stats` (
  `ShopStatID` int(11) NOT NULL AUTO_INCREMENT,
  `ShopRevID` int(11) NOT NULL,
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
  `ShopRevID` int(11) NOT NULL AUTO_INCREMENT,
  `ShopID` int(11) NOT NULL,
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
  `ShopID` int(11) NOT NULL,
  `SvcID` int(11) NOT NULL,
  `SvcPrice` decimal(10,2) NOT NULL,
  `MinWeight` int(11) DEFAULT NULL,
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
INSERT INTO `shop_services` VALUES (1,1,50.00,3),(1,2,55.00,3),(1,3,40.00,1),(1,4,55.00,3),(1,5,60.00,3);
/*!40000 ALTER TABLE `shop_services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_infos`
--

DROP TABLE IF EXISTS `staff_infos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_infos` (
  `StaffInfoID` int(11) NOT NULL AUTO_INCREMENT,
  `StaffID` varchar(10) NOT NULL,
  `StaffAge` int(11) DEFAULT NULL,
  `StaffAddress` varchar(100) DEFAULT NULL,
  `StaffCellNo` varchar(15) DEFAULT NULL,
  `StaffSalary` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`StaffInfoID`),
  KEY `fk_staff_info` (`StaffID`),
  CONSTRAINT `fk_staff_info` FOREIGN KEY (`StaffID`) REFERENCES `staffs` (`StaffID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_infos`
--

LOCK TABLES `staff_infos` WRITE;
/*!40000 ALTER TABLE `staff_infos` DISABLE KEYS */;
INSERT INTO `staff_infos` VALUES (1,'S1',18,'Taga Inyoha','09234242353',45000.00),(2,'S2',45,'Wa Hibaw','09314424555',150000.00);
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
  `StaffName` varchar(50) NOT NULL,
  `StaffRole` varchar(20) DEFAULT NULL,
  `ShopID` int(11) NOT NULL,
  PRIMARY KEY (`StaffID`),
  KEY `fk_staff_shop` (`ShopID`),
  CONSTRAINT `fk_staff_shop` FOREIGN KEY (`ShopID`) REFERENCES `laundry_shops` (`ShopID`) ON DELETE CASCADE,
  CONSTRAINT `fk_staff_user` FOREIGN KEY (`StaffID`) REFERENCES `users` (`UserID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staffs`
--

LOCK TABLES `staffs` WRITE;
/*!40000 ALTER TABLE `staffs` DISABLE KEYS */;
INSERT INTO `staffs` VALUES ('S1','Barako Lamaw','Staff',1),('S2','Wa El','Staff',1);
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_logs`
--

LOCK TABLES `user_logs` WRITE;
/*!40000 ALTER TABLE `user_logs` DISABLE KEYS */;
INSERT INTO `user_logs` VALUES (1,'A1','Admin','Login','Direct login success','2025-11-22 16:32:12'),(2,'O1','Shop Owner','Shop Owner Creation','New Shop Owner account created: O1','2025-11-22 16:32:48'),(3,'O1','Shop Owner','Login','Direct login success','2025-11-22 16:32:59'),(4,'S1','Staff','Staff Creation','New staff: Barako Lamaw (barako1)','2025-11-22 16:58:52'),(5,'S2','Staff','Staff Creation','New staff: Wa El (wa1)','2025-11-22 16:59:55'),(6,'A1','Admin','Login','Direct login success','2025-11-22 17:09:21');
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
  `IsActive` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `UserEmail` (`UserEmail`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('A1','mj1','mj1','Admin','2025-09-15 02:00:01',1),('A2','juriel2','juriel2','Admin','2025-09-15 02:00:02',1),('A3','kezhea3','kezhea3','Admin','2025-09-15 02:00:03',1),('A4','jasper4','jasper4','Admin','2025-09-15 02:00:04',1),('O1','testuser@gmail.com','$2b$10$CPNAwd8k9yhSJEqBpLl4r.KravvkKv/rFwKfUUrWJHBK2COfPENfi','Shop Owner','2025-11-22 16:32:48',1),('S1','barako1','$2b$10$z7e9iLl4ih2ufsP6e03HtO9/haiIPrML3BhP48uotcGrggM/rQHKq','Staff','2025-11-22 16:58:52',1),('S2','wa1','$2b$10$aFAwAMa9ayeXxNyXO//K0.P5Fbdx4183jq08pQ7xxoS3SurOZ4zEe','Staff','2025-11-22 16:59:55',1);
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

-- Dump completed on 2025-11-23  1:09:40
