-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: localhost    Database: feedbackapp
-- ------------------------------------------------------
-- Server version	8.0.40

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `devices`
--

DROP TABLE IF EXISTS `devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `devices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `deviceName` varchar(255) NOT NULL,
  `locationID` varchar(255) DEFAULT NULL,
  `locationGroupId` varchar(255) DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `deviceName` (`deviceName`)
) ENGINE=InnoDB AUTO_INCREMENT=109 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `devices`
--

LOCK TABLES `devices` WRITE;
/*!40000 ALTER TABLE `devices` DISABLE KEYS */;
INSERT INTO `devices` VALUES (101,'FL-101','1001','1',1,'2025-01-15 13:37:02'),(102,'GL-105','1002','1',1,'2025-01-16 04:56:53'),(103,'TEST-101','1002','1',0,'2025-01-29 06:14:10'),(104,'TEST-102','1002','1',1,'2025-01-29 06:31:35'),(105,'TEST-1033','1002','1',1,'2025-01-29 06:31:46'),(107,'TEST-000','1001','1',0,'2025-01-29 07:27:40'),(108,'TEST-101111','1001','1',1,'2025-01-31 12:53:43');
/*!40000 ALTER TABLE `devices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback`
--

DROP TABLE IF EXISTS `feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `device_id` int NOT NULL,
  `rating_id` int NOT NULL,
  `rating_name` varchar(255) NOT NULL,
  `rating_value` int NOT NULL,
  `rating_type` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `device_id` (`device_id`),
  KEY `rating_id` (`rating_id`),
  CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`),
  CONSTRAINT `feedback_ibfk_2` FOREIGN KEY (`rating_id`) REFERENCES `menuoptions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback`
--

LOCK TABLES `feedback` WRITE;
/*!40000 ALTER TABLE `feedback` DISABLE KEYS */;
INSERT INTO `feedback` VALUES (1,101,4,'Excellent',4,'Highly Positive','2025-01-28 11:51:59'),(2,101,1,'Poor',1,'Negative','2025-01-28 11:54:18'),(3,101,2,'Average',2,'Neutral','2025-01-28 12:41:17'),(4,101,3,'Good',3,'Positive','2025-01-28 19:17:41'),(5,102,1,'Poor',1,'Negative','2025-01-28 19:29:22'),(6,102,3,'Good',3,'Positive','2025-01-28 19:29:42'),(7,102,4,'Excellent',4,'Highly Positive','2025-01-28 19:29:55'),(8,102,1,'Poor',1,'Negative','2025-01-28 19:30:23'),(9,102,1,'Poor',1,'Negative','2025-01-28 19:30:29'),(10,102,2,'Average',2,'Neutral','2025-01-28 19:30:35'),(11,102,1,'Poor',1,'Negative','2025-01-28 19:31:20'),(12,101,4,'Excellent',4,'Highly Positive','2025-01-28 19:48:49'),(13,101,2,'Average',2,'Neutral','2025-01-28 19:48:56'),(14,101,1,'Poor',1,'Negative','2025-01-28 19:49:12'),(15,101,1,'Poor',1,'Negative','2025-01-28 19:49:50'),(16,101,1,'Poor',1,'Negative','2025-01-28 19:49:56'),(17,102,1,'Poor',1,'Negative','2025-01-28 20:09:21'),(18,101,1,'Poor',1,'Negative','2025-01-28 20:09:33'),(19,102,3,'Good',3,'Positive','2025-01-28 20:09:55'),(20,101,2,'Average',2,'Neutral','2025-01-28 20:09:57'),(21,102,3,'Good',3,'Positive','2025-01-28 20:10:20'),(22,101,4,'Excellent',4,'Highly Positive','2025-01-28 20:10:35'),(23,102,4,'Excellent',4,'Highly Positive','2025-01-28 20:10:37'),(24,102,1,'Poor',1,'Negative','2025-01-28 20:20:17'),(25,101,1,'Poor',1,'Negative','2025-01-29 04:46:45'),(26,101,1,'Poor',1,'Negative','2025-01-29 04:46:53'),(27,101,4,'Excellent',4,'Highly Positive','2025-01-29 04:47:27'),(28,101,1,'Poor',1,'Negative','2025-01-29 04:47:34'),(29,101,1,'Poor',1,'Negative','2025-01-29 06:22:32'),(30,101,1,'Poor',1,'Negative','2025-01-29 06:22:32');
/*!40000 ALTER TABLE `feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback_details`
--

DROP TABLE IF EXISTS `feedback_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback_details` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `feedback_id` bigint NOT NULL,
  `subrating_id` int NOT NULL,
  `subrating_name` varchar(255) NOT NULL,
  `subrating_type` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `feedback_id` (`feedback_id`),
  KEY `subrating_id` (`subrating_id`),
  CONSTRAINT `feedback_details_ibfk_1` FOREIGN KEY (`feedback_id`) REFERENCES `feedback` (`id`),
  CONSTRAINT `feedback_details_ibfk_2` FOREIGN KEY (`subrating_id`) REFERENCES `submenuoptions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback_details`
--

LOCK TABLES `feedback_details` WRITE;
/*!40000 ALTER TABLE `feedback_details` DISABLE KEYS */;
INSERT INTO `feedback_details` VALUES (1,2,1,'Dirty Basin','Maintanance','2025-01-28 11:54:18'),(2,2,2,'No Toilet Papers','Material','2025-01-28 11:54:18'),(3,2,3,'No Soap','Material','2025-01-28 11:54:18'),(4,5,4,'Dirty WC','Maintanance','2025-01-28 19:29:22'),(5,5,6,'Bad Smell','Maintanance','2025-01-28 19:29:22'),(6,8,2,'No Toilet Papers','Material','2025-01-28 19:30:23'),(7,9,2,'No Toilet Papers','Material','2025-01-28 19:30:29'),(8,11,2,'No Toilet Papers','Material','2025-01-28 19:31:20'),(9,14,7,'Wet Floor','Maintanance','2025-01-28 19:49:12'),(10,14,6,'Bad Smell','Maintanance','2025-01-28 19:49:12'),(11,15,7,'Wet Floor','Maintanance','2025-01-28 19:49:50'),(12,16,7,'Wet Floor','Maintanance','2025-01-28 19:49:56'),(13,17,7,'Wet Floor','Maintanance','2025-01-28 20:09:21'),(14,18,3,'No Soap','Material','2025-01-28 20:09:33'),(15,24,7,'Wet Floor','Maintanance','2025-01-28 20:20:17'),(16,25,2,'No Toilet Papers','Material','2025-01-29 04:46:46'),(17,26,2,'No Toilet Papers','Material','2025-01-29 04:46:53'),(18,28,2,'No Toilet Papers','Material','2025-01-29 04:47:34'),(19,30,2,'No Toilet Papers','Material','2025-01-29 06:22:32'),(20,29,2,'No Toilet Papers','Material','2025-01-29 06:22:32'),(21,29,3,'No Soap','Material','2025-01-29 06:22:32'),(22,30,3,'No Soap','Material','2025-01-29 06:22:32');
/*!40000 ALTER TABLE `feedback_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `license`
--

DROP TABLE IF EXISTS `license`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `license` (
  `id` int NOT NULL AUTO_INCREMENT,
  `count` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `count` (`count`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `license`
--

LOCK TABLES `license` WRITE;
/*!40000 ALTER TABLE `license` DISABLE KEYS */;
INSERT INTO `license` VALUES (1,5);
/*!40000 ALTER TABLE `license` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `locationgroup`
--

DROP TABLE IF EXISTS `locationgroup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `locationgroup` (
  `id` int NOT NULL AUTO_INCREMENT,
  `GroupName` varchar(255) NOT NULL,
  `active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `GroupName` (`GroupName`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locationgroup`
--

LOCK TABLES `locationgroup` WRITE;
/*!40000 ALTER TABLE `locationgroup` DISABLE KEYS */;
INSERT INTO `locationgroup` VALUES (1,'Dubai',1,'2025-01-15 13:31:12');
/*!40000 ALTER TABLE `locationgroup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `locations`
--

DROP TABLE IF EXISTS `locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `locations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `locationName` varchar(255) NOT NULL,
  `active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `locationName` (`locationName`)
) ENGINE=InnoDB AUTO_INCREMENT=1003 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locations`
--

LOCK TABLES `locations` WRITE;
/*!40000 ALTER TABLE `locations` DISABLE KEYS */;
INSERT INTO `locations` VALUES (1001,'RIS-Office',1,'2025-01-15 13:06:26'),(1002,'ABC Store',1,'2025-01-16 04:56:33');
/*!40000 ALTER TABLE `locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menuoptions`
--

DROP TABLE IF EXISTS `menuoptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menuoptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `menuoptionName` varchar(255) NOT NULL,
  `menuoptionValue` varchar(255) NOT NULL,
  `menuoptionType` varchar(255) NOT NULL,
  `menuoptionImage` varchar(255) NOT NULL,
  `active` tinyint(1) DEFAULT '1',
  `activeSubMenu` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `menuoptionName` (`menuoptionName`),
  UNIQUE KEY `menuoptionValue` (`menuoptionValue`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menuoptions`
--

LOCK TABLES `menuoptions` WRITE;
/*!40000 ALTER TABLE `menuoptions` DISABLE KEYS */;
INSERT INTO `menuoptions` VALUES (1,'Poor','1','Negative','/public/images/poor.webp',1,1,'2025-01-27 18:28:20','2025-01-27 18:28:20'),(2,'Average','2','Neutral','/public/images/average.webp',1,0,'2025-01-27 18:28:20','2025-01-27 18:28:20'),(3,'Good','3','Positive','/public/images/good.webp',1,0,'2025-01-27 18:28:20','2025-01-27 18:28:20'),(4,'Excellent','4','Highly Positive','/public/images/excellent.webp',1,0,'2025-01-27 18:28:20','2025-01-27 18:28:20');
/*!40000 ALTER TABLE `menuoptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `username` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phonenumber` varchar(30) DEFAULT NULL,
  `deviceID` varchar(50) NOT NULL,
  `opinion1` int DEFAULT NULL,
  `opinion2` int DEFAULT NULL,
  `opinion3` int DEFAULT NULL,
  `opinion4` int DEFAULT NULL,
  `opinion5` int DEFAULT NULL,
  `opinion6` int DEFAULT NULL,
  `opinion7` int DEFAULT NULL,
  `opinion8` int DEFAULT NULL,
  `opinion9` int DEFAULT NULL,
  `opinion10` int DEFAULT NULL,
  `opinion1_string` varchar(255) DEFAULT NULL,
  `opinion2_string` varchar(255) DEFAULT NULL,
  `opinion3_string` varchar(255) DEFAULT NULL,
  `opinion4_string` varchar(255) DEFAULT NULL,
  `opinion5_string` varchar(255) DEFAULT NULL,
  `opinion6_string` varchar(255) DEFAULT NULL,
  `opinion7_string` varchar(255) DEFAULT NULL,
  `opinion8_string` varchar(255) DEFAULT NULL,
  `opinion9_string` varchar(255) DEFAULT NULL,
  `opinion10_string` varchar(255) DEFAULT NULL,
  `Review_string` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (1,'2025-01-15 21:49:55','Shijin Peetayil','shijinpsajeevan@gmail.com','09995171926','101',1,3,3,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Facility feedback','Material availability feedback','Cleanliness feedback',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Good'),(2,'2025-01-15 22:12:12','Hameed','abc@hameed.com','0928309283','101',3,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Facility feedback','Material availability feedback','Cleanliness feedback',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'NO MATERIAL AVAILABLE'),(3,'2025-01-16 05:05:41','Atif','atif@risservices.ae','05298798749','102',3,2,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Facility feedback','Material availability feedback','Cleanliness feedback',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Facility was absolutely stunning.'),(4,'2025-01-16 05:16:37','Shijin Peetayil','shijinpsajeevan@gmail.com','09995171926','102',3,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Facility feedback','Material availability feedback','Cleanliness feedback',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Awesome'),(5,'2025-01-16 05:17:22','Divin','divin@abc.com','072712989','102',NULL,3,3,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Facility feedback','Material availability feedback','Cleanliness feedback',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Good'),(6,'2025-01-16 05:18:20','ABC',NULL,NULL,'102',3,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Facility feedback','Material availability feedback','Cleanliness feedback',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(7,'2025-01-16 06:55:03','Shijin',NULL,NULL,'101',2,3,3,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Facility feedback','Material availability feedback','Cleanliness feedback',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(8,'2025-01-16 06:56:24','R',NULL,NULL,'101',3,3,3,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Facility feedback','Material availability feedback','Cleanliness feedback',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `submenuoptions`
--

DROP TABLE IF EXISTS `submenuoptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `submenuoptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `submenuoptionName` varchar(255) NOT NULL,
  `submenuoptionType` varchar(255) NOT NULL,
  `submenuoptionImage` varchar(255) NOT NULL,
  `mainMenuID` varchar(255) NOT NULL,
  `active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `submenuoptionName` (`submenuoptionName`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `submenuoptions`
--

LOCK TABLES `submenuoptions` WRITE;
/*!40000 ALTER TABLE `submenuoptions` DISABLE KEYS */;
INSERT INTO `submenuoptions` VALUES (1,'Dirty Basin','Maintanance','/images/dirty_basin.png','1',1,'2025-01-27 19:00:32','2025-01-27 20:17:56'),(2,'No Toilet Papers','Material','/images/paper.png','1',1,'2025-01-27 19:00:32','2025-01-27 20:38:13'),(3,'No Soap','Material','/images/dispenser.png','1',1,'2025-01-27 19:00:32','2025-01-27 20:23:20'),(4,'Dirty WC','Maintanance','/images/toilet.png','1',1,'2025-01-27 19:00:32','2025-01-27 20:41:41'),(5,'Bin Full','Maintanance','/images/bin_full.png','1',1,'2025-01-27 19:00:32','2025-01-27 20:13:42'),(6,'Bad Smell','Maintanance','/images/bad_smell.png','1',1,'2025-01-27 19:00:32','2025-01-27 20:27:23'),(7,'Wet Floor','Maintanance','/images/wet_floor.png','1',1,'2025-01-27 19:00:32','2025-01-27 20:38:33');
/*!40000 ALTER TABLE `submenuoptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `active` tinyint(1) DEFAULT '1',
  `admin` tinyint(1) DEFAULT '0',
  `superAdmin` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (2,'shijin','shijin.p@risservices.ae','$2b$10$zvxIJv3g1IcQU1fTt.usguIfHblXs/Fy8yO4xQR8WKnXBFfeQvTWO',1,1,1,'2025-01-15 11:20:05','2025-01-15 11:20:05');
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

-- Dump completed on 2025-04-22 14:00:03
