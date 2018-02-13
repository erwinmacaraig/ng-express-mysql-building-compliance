CREATE TABLE `diagram_finish` (
 `diagram_finish_id` int(11) NOT NULL AUTO_INCREMENT,
 `name` varchar(150) NOT NULL,
 PRIMARY KEY (`diagram_finish_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1

INSERT INTO `diagram_finish` (`diagram_finish_id`, `name`) VALUES
(1, 'Budget Finish - Foam PVC'),
(2, 'Budget Finish - White ACM with UV Laminate'),
(3, 'Standard Acrylic'),
(4, 'Standard Brushed'),
(5, 'Deluxe 3D finish - Backed with silver vinyl'),
(6, 'Delux 3D finish- Acrylic backed in frost');