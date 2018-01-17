CREATE TABLE security_question (
  security_question_id INT(11) NOT NULL AUTO_INCREMENT,
  question VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (security_question_id)
)
ENGINE = INNODB
CHARACTER SET utf8
COLLATE utf8_general_ci;
