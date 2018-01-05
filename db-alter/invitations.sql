ALTER TABLE users ADD COLUMN invited_by_user INT NOT NULL DEFAULT 0 AFTER user_id;
DROP TABLE invitation_codes;
ALTER TABLE token ADD COLUMN id int not null default 0, ADD COLUMN id_type varchar(50) DEFAULT NULL;

DROP TABLE IF EXISTS user_invitations;
CREATE TABLE `user_invitations` (
  `user_invitations_id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(150) DEFAULT NULL,
  `last_name` varchar(150) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `location_id` int(11) NOT NULL DEFAULT '0',
  `account_id` int(11) NOT NULL DEFAULT '0',
  `role_id` int(11) NOT NULL DEFAULT '0',
  `eco_role_id` int(11) DEFAULT NULL,
  `mobility_impaired` int(11) NOT NULL DEFAULT '0',
  `contact_number` varchar(11) DEFAULT NULL,
  `invited_by_user` int(11) NOT NULL DEFAULT '0',
  `was_used` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`user_invitations_id`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=latin1
