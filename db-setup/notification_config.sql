CREATE TABLE `notification_config` (
  `notification_config_id` int(11) NOT NULL AUTO_INCREMENT,
  `building_id` int(11) DEFAULT NULL,
  `user_type` varchar(10) DEFAULT NULL,
  `users` longtext,
  `user_responded` longtext,
  `message` longtext,
  `frequency` int(3) DEFAULT NULL,
  `recipients` int(11) DEFAULT NULL,
  `responders` int(11) DEFAULT NULL,
  `building_manager` int(11) DEFAULT NULL,
  `dtLastSent` datetime DEFAULT NULL,
  PRIMARY KEY (`notification_config_id`),
  CONSTRAINT UNIQUE KEY (`building_id`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8
