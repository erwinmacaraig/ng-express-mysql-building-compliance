CREATE TABLE reward_program_activities (
    reward_program_activities_id INT NOT NULL AUTO_INCREMENT,
    reward_program_config_id INT,
    activity VARCHAR(255),
    activity_points INT,
    CONSTRAINT PRIMARY KEY (reward_program_activities_id),
    CONSTRAINT FOREIGN KEY (reward_program_config_id) REFERENCES reward_program_config(reward_program_config_id) ON DELETE CASCADE
)engine=InnoDB;