ALTER TABLE `products` ADD `category` VARCHAR(150) NULL;

ALTER TABLE `products_favorites` ADD `account_id` INT NOT NULL DEFAULT '0';