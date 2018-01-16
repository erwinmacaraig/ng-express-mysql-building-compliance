CREATE TABLE `user_requests` (
 `user_requests_id` int(11) NOT NULL AUTO_INCREMENT,
 `user_id` int(11) NOT NULL,
 `requested_role_id` tinyint(1) NOT NULL DEFAULT '0',
 `location_id` int(11) NOT NULL,
 `approver_id` int(11) NOT NULL,
 `status` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0 - review 1 - approved 2 - declined',
 `date_created` datetime NOT NULL,
 `date_responded` datetime NULL DEFAULT NULL,
 `viewed` tinyint(1) NOT NULL DEFAULT '0',
 PRIMARY KEY (`user_requests_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1