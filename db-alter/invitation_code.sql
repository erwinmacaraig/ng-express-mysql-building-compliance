DROP TABLE IF EXISTS invitation_codes;
CREATE TABLE `invitation_codes` (
  `invitation_code_id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(250) NOT NULL,
  `first_name` varchar(150),
  `last_name` varchar(150),
  `email` varchar(150),
  `location_id` int(11) NOT NULL DEFAULT 0,
  `account_id` int(11) NOT NULL DEFAULT 0,
  `role_id` int(11) NOT NULL DEFAULT 0,
  `contact_number` varchar(11) DEFAULT NULL,
  `invited_by_user` int(11) NOT NULL DEFAULT '0',
  `was_used` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`invitation_code_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1
