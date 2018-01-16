ALTER TABLE `token` DROP `user_id`;

ALTER TABLE `token` ADD `id` INT NOT NULL DEFAULT 0 AFTER `expiration_date`, ADD `id_type` VARCHAR(50) NOT NULL AFTER `id`;