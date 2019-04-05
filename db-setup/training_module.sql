DROP TABLE IF EXISTS training_module;
CREATE TABLE training_module (
     training_module_id INT NOT NULL AUTO_INCREMENT,
     training_requirement_id INT,
     module_id INT,
     module_name TEXT,
     module_subname TEXT,
     logo VARCHAR(100),
     module_launcher TEXT,
     module_skill_points INT DEFAULT 0,
     addedBy INT,
     dtAdded DATETIME DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT PRIMARY KEY (training_module_id),
     CONSTRAINT FOREIGN KEY (module_id) REFERENCES module (training_module_id),
     CONSTRAINT FOREIGN KEY (training_requirement_id) REFERENCES training_requirement (training_requirement_id)     
) engine=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;