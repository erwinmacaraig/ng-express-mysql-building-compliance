CREATE TABLE reward_program_buildings (
    reward_program_buildings_id INT NOT NULL AUTO_INCREMENT,
    location_id INT,
    reward_program_config_id INT,
    dtAdded DATETIME DEFAULT current_timestamp,
    CONSTRAINT PRIMARY KEY (reward_program_buildings_id),
    CONSTRAINT FOREIGN KEY (reward_program_config_id) 
    REFERENCES reward_program_config(reward_program_config_id) ON DELETE CASCADE,
    CONSTRAINT UNIQUE KEY (location_id, reward_program_config_id)
) engine=InnoDB;