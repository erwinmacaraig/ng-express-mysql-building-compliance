DROP TABLE IF EXISTS scorm_training_rel;
CREATE TABLE scorm_training_rel (
    scorm_training_rel_id INT NOT NULL AUTO_INCREMENT,
    user_training_module_relation_id INT,
    parameter_name VARCHAR(255),
    parameter_value TEXT,
    CONSTRAINT PRIMARY KEY (scorm_training_rel_id),
    CONSTRAINT FOREIGN KEY (user_training_module_relation_id) REFERENCES user_training_module_relation (user_training_module_relation_id),
    CONSTRAINT UNIQUE KEY module_lecture (user_training_module_relation_id, parameter_name)
) engine=InnoDB AUTO_INCREMENT=0 CHARSET=utf8;