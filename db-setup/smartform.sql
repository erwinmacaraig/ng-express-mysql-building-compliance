CREATE TABLE `smart_form` (
 `smart_form_id` int(11) NOT NULL AUTO_INCREMENT,
 `name` varchar(150) NOT NULL,
 `data` longtext NOT NULL,
 `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
 `date_created` DATE NOT NULL,
 PRIMARY KEY (`smart_form_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `smart_form_answers` (
 `smart_form_answers_id` int(11) NOT NULL AUTO_INCREMENT,
 `smart_form_id` int(11) NOT NULL,
 `answers` text,
 `user_id` int(11) NOT NULL,
 `location_id` INT NOT NULL,
 `account_id` INT NOT NULL,
 `date_created` date NOT NULL,
 PRIMARY KEY (`smart_form_answers_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;