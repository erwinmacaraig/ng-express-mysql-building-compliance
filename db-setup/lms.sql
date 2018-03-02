CREATE TABLE scorm_course (
    course_id INT NOT NULL AUTO_INCREMENT,
    course_name VARCHAR(255),
    course_launcher VARCHAR(255),
    dtCreated DATETIME DEFAULT current_timestamp,
    CONSTRAINT PRIMARY KEY (course_id)
)engine=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS course_user_relation;
CREATE TABLE course_user_relation (
  course_user_relation_id INT NOT NULL AUTO_INCREMENT,
  user_id INT DEFAULT 0,
  course_id INT DEFAULT 0,
  training_requirement_id INT DEFAULT 0,
  dtTimeStamp DATETIME DEFAULT current_timestamp,
  PRIMARY KEY (course_user_relation_id),
  UNIQUE KEY user_course (user_id, course_id, training_requirement_id)
)engine=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;


CREATE TABLE `scorm` (
  `scorm_id` int(11) NOT NULL AUTO_INCREMENT,
  `course_user_relation_id` INT,
  `parameter_name` varchar(255) DEFAULT NULL,
  `parameter_value` text DEFAULT NULL,
  PRIMARY KEY (`scorm_id`),
  UNIQUE KEY `course_lecture` (`course_user_relation_id`, `parameter_name`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;
