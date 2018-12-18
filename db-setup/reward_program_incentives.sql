CREATE TABLE reward_program_incentives (
    reward_program_incentives_id INT NOT NULL AUTO_INCREMENT,
    reward_program_config_id INT,
    incentive VARCHAR(100),
    points_to_earn INT,
    CONSTRAINT PRIMARY KEY (reward_program_incentives_id),
    CONSTRAINT FOREIGN KEY (reward_program_config_id) 
    REFERENCES reward_program_config(reward_program_config_id) ON DELETE CASCADE
) engine=InnoDB;