CREATE TABLE `products_relation` (
 `products_relation_id` int(11) NOT NULL AUTO_INCREMENT,
 `parent_product_id` int(11) NOT NULL,
 `product_id` int(11) NOT NULL,
 PRIMARY KEY (`products_relation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1