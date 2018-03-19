ALTER TABLE `mobility_impaired_details` ADD `user_invitations_id` INT NOT NULL DEFAULT '0'
ALTER TABLE `user_invitations` ADD `archived` TINYINT(1) NOT NULL DEFAULT '0';