CREATE TABLE user_location_validation (
    user_location_validation_id INT NOT NULL AUTO_INCREMENT,
    user_id INT DEFAULT 0,
    approver_id INT DEFAULT 0,
    role_id INT DEFAULT 0,
    location_id INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'PENDING',
    token_id INT NOT NULL DEFAULT 0,
    request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PRIMARY KEY (user_location_validation_id)
) engine=InnoDB;
