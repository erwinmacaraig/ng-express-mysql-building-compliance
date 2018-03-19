ALTER TABLE `locations`
ADD `admin_verified` TINYINT(1) NOT NULL DEFAULT '0',
ADD `admin_verified_date` DATE NULL DEFAULT NULL,
ADD `admin_id` INT NOT NULL DEFAULT '0';