CREATE TABLE `products_favorites` (
 `products_favorites_id` int(11) NOT NULL AUTO_INCREMENT,
 `product_id` int(11) NOT NULL,
 `quantity` int(11) NOT NULL DEFAULT '1',
 `user_id` int(11) NOT NULL,
 `target_user_id` INT NOT NULL DEFAULT '0',
 `diagram_finish_id` INT NOT NULL DEFAULT '0',
 `pdf_only` TINYINT(1) NOT NULL DEFAULT '0',
 `location_id` INT NOT NULL DEFAULT '0'
 PRIMARY KEY (`products_favorites_id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=latin1