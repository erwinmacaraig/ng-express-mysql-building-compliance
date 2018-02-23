ALTER TABLE `transactions` DROP `target_user_id`;
ALTER TABLE `transactions` DROP `diagram_finish_id`;
ALTER TABLE `transactions` DROP `pdf_only`;


ALTER TABLE `transactions` ADD `account_id` INT NOT NULL DEFAULT '0'