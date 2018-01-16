CREATE TABLE security_answer (
  security_answer_id INT(11) NOT NULL AUTO_INCREMENT,
  security_question_id INT(11) DEFAULT NULL,
  user_id INT(11) DEFAULT NULL,
  answer VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (security_answer_id)
)
ENGINE = INNODB
CHARACTER SET utf8
COLLATE utf8_general_ci;
