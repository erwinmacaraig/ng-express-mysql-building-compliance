ALTER TABLE `transactions` ADD `expiration_date` DATE NULL AFTER `date_paid`;
ALTER TABLE `transactions` ADD `target_user_id` INT NOT NULL DEFAULT '0' AFTER `expiration_date`;
ALTER TABLE `transactions` ADD `diagram_finish_id` INT NULL AFTER `target_user_id`;
ALTER TABLE `transactions` ADD `location_id` INT NOT NULL DEFAULT '0' AFTER `diagram_finish`;
ALTER TABLE `transactions` ADD `pdf_only` TINYINT(1) NOT NULL DEFAULT '0' AFTER `location_id`;

ALTER TABLE `products` ADD `months_of_validity` TINYINT NOT NULL DEFAULT '0' AFTER `archived`;