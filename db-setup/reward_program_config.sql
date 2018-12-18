CREATE TABLE `reward_program_config` (
  `reward_program_config_id` int(11) NOT NULL AUTO_INCREMENT,
  `sponsor_to_id` int(11) NOT NULL DEFAULT '0',
  `sponsor_to_id_type` varchar(50) DEFAULT NULL,
  `sponsor` varchar(255) DEFAULT NULL,
  `sponsor_contact_email` varchar(100) DEFAULT NULL,
  `user_role` int(11) DEFAULT '0',
  `enabled` tinyint(4) DEFAULT '1',
  `modified_by` int(11) DEFAULT '0',
  `raw_config` longtext,
  `dtModified` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `dtAdded` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`reward_program_config_id`),
  UNIQUE KEY `sponsor_to_id` (`sponsor_to_id`,`sponsor_to_id_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8