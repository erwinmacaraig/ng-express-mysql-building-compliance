--
-- Table structure for table `token`
--

CREATE TABLE `token` (
 `token_id` int(11) NOT NULL AUTO_INCREMENT,
 `token` varchar(100) NOT NULL,
 `user_id` int(11) NOT NULL,
 `action` varchar(20) NOT NULL,
 `verified` tinyint(1) NOT NULL DEFAULT '0',
 `expiration_date` datetime NOT NULL,
 PRIMARY KEY (`token_id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=latin1

ALTER TABLE `token`
  ADD PRIMARY KEY (`token_id`);