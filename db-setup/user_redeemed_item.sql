CREATE TABLE user_redeemed_item (
    user_redeemed_item_id INT NOT NULL AUTO_INCREMENT,
    user_id INT,
    reward_program_config_id INT,
    reward_program_incentives_id INT,
    dtRedeemed DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PRIMARY KEY (user_redeemed_item_id),
    CONSTRAINT FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT FOREIGN KEY (reward_program_config_id) REFERENCES reward_program_config (reward_program_config_id) ON DELETE CASCADE,
    CONSTRAINT FOREIGN KEY (reward_program_incentives_id) REFERENCES reward_program_incentives (reward_program_incentives_id) ON DELETE CASCADE,
    CONSTRAINT UNIQUE KEY (user_id, reward_program_config_id, reward_program_incentives_id)
) engine=InnoDB;