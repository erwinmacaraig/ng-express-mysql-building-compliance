CREATE TABLE `mobility_impaired_details` (
 `mobility_impaired_details_id` int(11) NOT NULL AUTO_INCREMENT,
 `user_id` int(11) NOT NULL,
 `location_id` int(11) NOT NULL,
 `is_permanent` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1 - permanent 0 - temporary',
 `duration_date` date DEFAULT NULL,
 `assistant_type` tinytext,
 `equipment_type` tinytext,
 `evacuation_procedure` tinytext,
 `date_created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (`mobility_impaired_details_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1