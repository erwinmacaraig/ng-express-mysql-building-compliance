CREATE TABLE user_reward_points (
    user_reward_points_id INT NOT NULL AUTO_INCREMENT,
    user_id INT,
    reward_program_config_id INT,
    activity INT DEFAULT 0,
    CONSTRAINT PRIMARY KEY (user_reward_points_id),
    CONSTRAINT FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT FOREIGN KEY (user_reward_points_id)
    REFERENCES reward_program_config(reward_program_config_id) ON DELETE CASCADE    
) engine=InnoDB;