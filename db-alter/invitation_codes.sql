DROP TABLE IF EXISTS invitation_codes;
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
