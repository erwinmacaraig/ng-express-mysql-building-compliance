DROP TABLE IF EXISTS user_training_module_relation;
CREATE TABLE user_training_module_relation (
     user_training_module_relation_id INT NOT NULL AUTO_INCREMENT,
     training_requirement_id INT,
     user_id INT,
     training_module_id INT,
     disabled TINYINT DEFAULT 0,
     completed TINYINT DEFAULT 0,
     dtLastAccessed DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
     dtCompleted DATETIME DEFAULT NULL,
     dtAdded DATETIME DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT PRIMARY KEY (user_training_module_relation_id),
     CONSTRAINT FOREIGN KEY (training_requirement_id) REFERENCES training_requirement (training_requirement_id),
     CONSTRAINT FOREIGN KEY (user_id) REFERENCES users (user_id),
     CONSTRAINT FOREIGN KEY (training_module_id) REFERENCES training_module (training_module_id),
     CONSTRAINT UNIQUE KEY user_training_modules (user_id, training_requirement_id, training_module_id)
) engine=InnoDB AUTO_INCREMENT=0 CHARSET=utf8;