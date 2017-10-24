--
-- Table structure for table `token`
--
DROP TABLE IF EXISTS token;
CREATE TABLE `token` (
 `token_id` int(11) NOT NULL AUTO_INCREMENT,
 `token` varchar(100) NOT NULL,
 `user_id` int(11) NOT NULL,
 `action` varchar(20) NOT NULL,
 `verified` tinyint(1) NOT NULL DEFAULT '0',
 `expiration_date` datetime NOT NULL,
 PRIMARY KEY (`token_id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=latin1;


CREATE TABLE `invitation_codes` (
 `invitation_code_id` int(11) NOT NULL AUTO_INCREMENT,
 `code` varchar(250) NOT NULL,
 `first_name` varchar(150) NOT NULL,
 `last_name` varchar(150) NOT NULL,
 `email` varchar(150) NOT NULL,
 `location_id` int(11) NOT NULL,
 `account_id` int(11) NOT NULL,
 `role_id` int(11) NOT NULL,
 `was_used` tinyint(1) NOT NULL DEFAULT '0',
 PRIMARY KEY (`invitation_code_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1


ALTER TABLE `user_role_relation` ADD `location_id` INT NOT NULL DEFAULT '0' AFTER `role_id`;